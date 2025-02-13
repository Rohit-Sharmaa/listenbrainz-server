import * as React from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { faPlay, faHourglass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatListenCount, formatReleaseDate } from "./utils";
import {
  generateAlbumArtThumbnailLink,
  getAlbumArtFromReleaseMBID,
} from "../../utils/utils";
import Pill from "../../components/Pill";

type ReleaseCardProps = {
  releaseDate: string;
  artistMBIDs: Array<string>;
  releaseMBID: string;
  releaseName: string;
  artistCreditName: string;
  releaseTypePrimary: string | undefined | null;
  releaseTypeSecondary: string | undefined | null;
  confidence?: number | null;
  caaID: number | null;
  caaReleaseMBID: string | null;
  showReleaseTitle?: boolean;
  showArtist?: boolean;
  showInformation?: boolean;
  showTags?: boolean;
  showListens?: boolean;
  releaseTags: Array<string>;
  listenCount: number;
};

export default function ReleaseCard(props: ReleaseCardProps) {
  const {
    releaseMBID,
    releaseDate,
    releaseName,
    artistMBIDs,
    artistCreditName,
    releaseTypePrimary,
    releaseTypeSecondary,
    confidence,
    caaID,
    caaReleaseMBID,
    showReleaseTitle,
    showArtist,
    showInformation,
    showTags,
    showListens,
    releaseTags,
    listenCount,
  } = props;

  const [imageLoaded, setImageLoaded] = React.useState(false);

  const futureRelease = new Date(releaseDate) > new Date();
  const COVERART_PLACEHOLDER = "/static/img/cover-art-placeholder.jpg";
  const RELEASE_TYPE_UNKNOWN = "Unknown";

  const [coverartSrc, setCoverartSrc] = React.useState<string>();

  function releaseTypeTooltip(): string | undefined | null {
    if (
      (releaseTypeSecondary !== undefined &&
        releaseTypePrimary === undefined) ||
      (releaseTypeSecondary !== null && releaseTypePrimary === null)
    )
      return releaseTypeSecondary;

    if (
      (releaseTypePrimary !== undefined &&
        releaseTypeSecondary === undefined) ||
      (releaseTypePrimary !== null && releaseTypeSecondary === null)
    )
      return releaseTypePrimary;

    if (
      (releaseTypePrimary === undefined &&
        releaseTypeSecondary === undefined) ||
      (releaseTypePrimary === null && releaseTypeSecondary === null)
    )
      return "";

    return `${releaseTypePrimary} + ${releaseTypeSecondary}`;
  }

  const releaseCoverArtIcon = (
    <FontAwesomeIcon icon={futureRelease ? faHourglass : faPlay} />
  );
  const coverArtPlaceholder = (
    <div
      className={`release-coverart-placeholder release-coverart ${
        imageLoaded ? "hide-placeholder" : ""
      }`}
    >
      {releaseCoverArtIcon}
    </div>
  );

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  React.useEffect(() => {
    async function getCoverArt() {
      const coverartURL = await getAlbumArtFromReleaseMBID(releaseMBID);
      if (coverartURL) {
        setCoverartSrc(coverartURL);
      }
    }

    if (caaID && caaReleaseMBID) {
      const coverartURL = generateAlbumArtThumbnailLink(caaID, caaReleaseMBID);
      setCoverartSrc(coverartURL);
    } else {
      getCoverArt();
    }
  }, [releaseMBID, caaID, caaReleaseMBID, setCoverartSrc]);

  return (
    <div className="release-card-container">
      <div className="release-item">
        {showListens && listenCount ? (
          <div className="listen-count">
            <Pill title="Listens" type="secondary" active>
              <>
                <FontAwesomeIcon icon={faPlay} />
                <span className="listen-count-number">
                  {formatListenCount(listenCount)}
                </span>
              </>
            </Pill>
          </div>
        ) : null}
        <div className="release-information">
          {showTags && releaseTags && releaseTags.length ? (
            <div className="cover-art-info">
              {releaseTags.join(", ").length > 26 ? (
                <div className="tags" title={releaseTags.join(", ")}>
                  {releaseTags.join(", ").substring(0, 23)}...
                </div>
              ) : (
                <div className="tags">{releaseTags.join(", ")}</div>
              )}
            </div>
          ) : null}
          {showInformation && (
            <div className="cover-art-info">
              <div className="release-type-chip" title={releaseTypeTooltip()!}>
                {releaseTypeSecondary ||
                  releaseTypePrimary ||
                  RELEASE_TYPE_UNKNOWN}
              </div>
              <div className="release-date">
                {formatReleaseDate(releaseDate)}
              </div>
            </div>
          )}
        </div>
        <a
          href={`/player/release/${releaseMBID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="release-coverart-container"
        >
          {coverartSrc ? (
            <>
              {coverArtPlaceholder}
              <LazyLoadImage
                className={`release-coverart ${
                  imageLoaded ? "" : "hide-image"
                }`}
                src={coverartSrc}
                alt={`${releaseName} by ${artistCreditName}`}
                onLoad={handleImageLoad}
              />
              <div className="hover-backdrop">{releaseCoverArtIcon}</div>
            </>
          ) : (
            <div className="release-coverart release-coverart-placeholder">
              {releaseCoverArtIcon}
            </div>
          )}
        </a>
      </div>
      {showReleaseTitle && (
        <div className="name-type-container">
          <div className="release-name" title={releaseName}>
            <a
              href={`/player/release/${releaseMBID}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {releaseName}
            </a>
          </div>
        </div>
      )}
      {showArtist && (
        <div className="release-artist" title={artistCreditName}>
          <a
            href={`https://musicbrainz.org/artist/${artistMBIDs[0]}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {artistCreditName}
          </a>
        </div>
      )}
    </div>
  );
}
