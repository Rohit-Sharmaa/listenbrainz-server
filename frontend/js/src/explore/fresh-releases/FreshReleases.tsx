import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";
import { uniqBy } from "lodash";
import Spinner from "react-loader-spinner";
import { toast } from "react-toastify";
import { faGear, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import withAlertNotifications from "../../notifications/AlertNotificationsHOC";
import GlobalAppContext from "../../utils/GlobalAppContext";
import { ToastMsg } from "../../notifications/Notifications";
import { getPageProps } from "../../utils/utils";
import ErrorBoundary from "../../utils/ErrorBoundary";
import ReleaseCard from "./ReleaseCard";
import ReleaseFilters from "./ReleaseFilters";
import ReleaseTimeline from "./ReleaseTimeline";
import Pill from "../../components/Pill";
import ReleaseCardsGrid from "./ReleaseCardsGrid";

const initialDisplayState = {
  "Release Title": true,
  Artist: true,
  Information: true,
  Tags: false,
  Listens: false,
};

export default function FreshReleases() {
  const { APIService, currentUser } = React.useContext(GlobalAppContext);

  const isLoggedIn: boolean = Object.keys(currentUser).length !== 0;
  const PAGE_TYPE_USER: string = "user";
  const PAGE_TYPE_SITEWIDE: string = "sitewide";

  const [releases, setReleases] = React.useState<Array<FreshReleaseItem>>([]);
  const [filteredList, setFilteredList] = React.useState<
    Array<FreshReleaseItem>
  >([]);
  const [allFilters, setAllFilters] = React.useState<{
    releaseTypes: Array<string | undefined>;
    releaseTags: Array<string | undefined>;
  }>({
    releaseTypes: [],
    releaseTags: [],
  });
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [pageType, setPageType] = React.useState<string>(
    isLoggedIn ? PAGE_TYPE_USER : PAGE_TYPE_SITEWIDE
  );

  const [isSidebarOpen, setIsSidebarOpen] = React.useState<boolean>(false);

  const [range, setRange] = React.useState<string>("week");
  const [displaySettings, setDisplaySettings] = React.useState<{
    [key: string]: boolean;
  }>(initialDisplayState);
  const [showPastReleases, setShowPastReleases] = React.useState<boolean>(true);
  const [showFutureReleases, setShowFutureReleases] = React.useState<boolean>(
    true
  );
  const [sort, setSort] = React.useState<string>("release_date");

  const handleRangeChange = (childData: string) => {
    setRange(childData);
  };

  const toggleSettings = (setting: string) => {
    setDisplaySettings({
      ...displaySettings,
      [setting]: !displaySettings[setting],
    });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const convertRangeToDays = (releaseRange: string): number => {
    switch (releaseRange) {
      case "week":
        return 7;
      case "month":
        return 30;
      case "three_months":
        return 90;
      default:
        return 1;
    }
  };

  React.useEffect(() => {
    const fetchReleases = async () => {
      setIsLoading(true);
      let freshReleases: Array<FreshReleaseItem>;
      try {
        if (pageType === PAGE_TYPE_SITEWIDE) {
          const allFreshReleases = await APIService.fetchSitewideFreshReleases(
            convertRangeToDays(range),
            showPastReleases,
            showFutureReleases,
            sort
          );
          freshReleases = allFreshReleases.payload.releases;
        } else {
          const userFreshReleases = await APIService.fetchUserFreshReleases(
            currentUser.name
          );
          freshReleases = userFreshReleases.payload.releases;
        }

        const cleanReleases = uniqBy(freshReleases, (datum) => {
          return (
            /*
             * toLowerCase() solves an edge case.
             * Example:
             * "release_name": "Waterslide, Diving Board, Ladder to the Sky"
             * "release_name": "Waterslide, Diving Board, Ladder To The Sky"
             * These releases will be considered unique.
             */
            datum.release_name.toLowerCase() +
            datum.artist_credit_name.toLowerCase()
          );
        });
        const releaseTypes = cleanReleases
          .map(
            (release) =>
              release.release_group_secondary_type ||
              release.release_group_primary_type
          )
          .filter(
            (value, index, self) =>
              self.indexOf(value) === index &&
              value !== undefined &&
              value !== null
          );

        const uniqueReleaseTagsSet = new Set<string>();
        cleanReleases.forEach((item) => {
          item.release_tags.forEach((tag) => {
            uniqueReleaseTagsSet.add(tag);
          });
        });

        const releaseTags = Array.from(uniqueReleaseTagsSet);

        setReleases(cleanReleases);
        setFilteredList(cleanReleases);
        setAllFilters({
          releaseTypes,
          releaseTags,
        });
        setIsLoading(false);
      } catch (error) {
        toast.error(
          <ToastMsg
            title="Couldn't fetch fresh releases"
            message={
              typeof error === "object" ? error.message : error.toString()
            }
          />,
          { toastId: "fetch-error" }
        );
      }
    };
    // Call the async function defined above (useEffect can't return a Promise)
    fetchReleases();
  }, [pageType, range, showPastReleases, showFutureReleases, sort]);

  return (
    <div className="row">
      <div className="col-xs-12 col-md-10">
        <div
          id="fr-pill-row"
          style={!isLoggedIn ? { justifyContent: "flex-end" } : {}}
        >
          {isLoggedIn ? (
            <div id="fr-row">
              <Pill
                id="sitewide-releases"
                onClick={() => setPageType(PAGE_TYPE_SITEWIDE)}
                active={pageType === PAGE_TYPE_SITEWIDE}
                type="secondary"
              >
                All
              </Pill>
              <Pill
                id="user-releases"
                onClick={() => setPageType(PAGE_TYPE_USER)}
                active={pageType === PAGE_TYPE_USER}
                type="secondary"
              >
                For You
              </Pill>
            </div>
          ) : null}
          <div id="fr-row">
            <span>Sort By:</span>{" "}
            <div className="input-group">
              <select
                id="style"
                className="form-control"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="release_date">Release Date</option>
                <option value="artist_credit_name">Artist</option>
                <option value="release_name">Release Title</option>
              </select>
            </div>
          </div>
        </div>
        <div className="releases-page row">
          {isLoading ? (
            <div className="spinner-container">
              <Spinner
                type="Grid"
                color="#eb743b"
                height={100}
                width={100}
                visible
              />
              <div
                className="text-muted"
                style={{ fontSize: "2rem", margin: "1rem" }}
              >
                Loading Fresh Releases&#8230;
              </div>
            </div>
          ) : (
            <div id="release-card-grids">
              {filteredList.length === 0 ? (
                <div id="no-release">
                  <img
                    src="/static/img/recommendations/no-freshness.png"
                    alt="No Releases Found"
                  />
                </div>
              ) : (
                <ReleaseCardsGrid
                  filteredList={filteredList}
                  displaySettings={displaySettings}
                  order={sort}
                />
              )}

              {pageType === PAGE_TYPE_SITEWIDE && releases.length > 0 ? (
                <div className="releases-timeline col-xs-12 col-md-1">
                  <ReleaseTimeline releases={filteredList} order={sort} />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
      <div
        className={`release-filters ${
          isSidebarOpen ? "open" : ""
        } col-xs-12 col-md-2`}
      >
        <ReleaseFilters
          allFilters={allFilters}
          releases={releases}
          setFilteredList={setFilteredList}
          range={range}
          handleRangeChange={handleRangeChange}
          displaySettings={displaySettings}
          toggleSettings={toggleSettings}
          showPastReleases={showPastReleases}
          setShowPastReleases={setShowPastReleases}
          showFutureReleases={showFutureReleases}
          setShowFutureReleases={setShowFutureReleases}
        />
      </div>
      <button
        className="toggle-sidebar-button"
        style={{
          backgroundColor: isSidebarOpen ? "#353070" : "#fff",
          color: isSidebarOpen ? "#fff" : "#353070",
        }}
        onClick={toggleSidebar}
        type="button"
      >
        <FontAwesomeIcon icon={isSidebarOpen ? faXmark : faGear} size="2x" />
      </button>
    </div>
  );
}

document.addEventListener("DOMContentLoaded", () => {
  const { domContainer, globalAppContext, sentryProps } = getPageProps();
  const { sentry_dsn, sentry_traces_sample_rate } = sentryProps;

  if (sentry_dsn) {
    Sentry.init({
      dsn: sentry_dsn,
      integrations: [new Integrations.BrowserTracing()],
      tracesSampleRate: sentry_traces_sample_rate,
    });
  }
  const FreshReleasesPageWithAlertNotifications = withAlertNotifications(
    FreshReleases
  );

  ReactDOM.render(
    <ErrorBoundary>
      <GlobalAppContext.Provider value={globalAppContext}>
        <FreshReleasesPageWithAlertNotifications />
      </GlobalAppContext.Provider>
    </ErrorBoundary>,
    domContainer
  );
});
