import { appParams } from "@/lib/app-params";

/**
 * Uploads a file to Base44 storage using XMLHttpRequest with real upload
 * progress tracking and a proper timeout. The SDK's axios-based UploadFile
 * hangs silently on large video files — this bypasses it so the user gets
 * a progress bar and a guaranteed resolution (success or error).
 *
 * @param {File} file - The file to upload
 * @param {(percent: number) => void} [onProgress] - Progress callback (0–100)
 * @returns {Promise<{ file_url: string }>}
 */
export function uploadFileWithProgress(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file, file.name);

    const appId = appParams.appId;
    const token =
      appParams.token ||
      (typeof localStorage !== "undefined"
        ? localStorage.getItem("base44_access_token")
        : null);
    const url = `/api/apps/${appId}/integration-endpoints/Core/UploadFile`;

    xhr.open("POST", url);
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }
    // 5-minute hard ceiling — progress tracking keeps the user informed
    // while this catches genuine stalls.
    xhr.timeout = 300000;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.ontimeout = () => reject(new Error("timeout"));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve(res);
        } catch {
          reject(new Error("Invalid response from server"));
        }
      } else {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };

    xhr.send(formData);
  });
}