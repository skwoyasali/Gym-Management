import { useEffect, useState } from "react";
import api from "../../services/api";

export default function MemberAvatar({
  name,
  photoUrl,
  previewUrl,
  className = "h-10 w-10",
}) {
  const [authenticatedPhoto, setAuthenticatedPhoto] = useState(null);
  const [failedSource, setFailedSource] = useState("");

  useEffect(() => {
    let active = true;
    let objectUrl;

    if (!photoUrl || previewUrl) {
      return () => {
        active = false;
      };
    }

    api
      .get(photoUrl, { responseType: "blob" })
      .then((response) => {
        const nextObjectUrl = URL.createObjectURL(response.data);
        if (active) {
          objectUrl = nextObjectUrl;
          setAuthenticatedPhoto({ photoUrl, src: nextObjectUrl });
        } else {
          URL.revokeObjectURL(nextObjectUrl);
        }
      })
      .catch((error) => {
        if (error.response?.status !== 404) {
          console.error("Load member photo error:", error);
        }
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photoUrl, previewUrl]);

  const imageSource =
    previewUrl ||
    (authenticatedPhoto && authenticatedPhoto.photoUrl === photoUrl
      ? authenticatedPhoto.src
      : "");
  const imageFailed = failedSource === imageSource;
  const initials = name?.trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      role="img"
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-100 font-semibold text-indigo-700 ${className}`}
      aria-label={name ? `${name} profile photo` : "Member profile photo"}
    >
      {imageSource && !imageFailed ? (
        <img
          src={imageSource}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailedSource(imageSource)}
        />
      ) : (
        initials
      )}
    </span>
  );
}
