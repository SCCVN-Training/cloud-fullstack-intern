import { environment } from '../../../../environments/environment';

export const FILE_OPERATION_ENDPOINTS = {
  uploadFiles: `${environment.apiUrl}/api/v1/storage/files`,
  folders: `${environment.apiUrl}/api/v1/storage/folders`,
  getStorage: `${environment.apiUrl}/api/v1/storage/retrieve`,
  uploadPresign: `${environment.apiUrl}/api/v1/storage/upload/presign`,
  uploadComplete: `${environment.apiUrl}/api/v1/storage/upload/complete`,
  multipartInitiate: `${environment.apiUrl}/api/v1/storage/upload/multipart/initiate`,
  multipartPresignPart: `${environment.apiUrl}/api/v1/storage/upload/multipart/presign-part`,
  multipartComplete: `${environment.apiUrl}/api/v1/storage/upload/multipart/complete`,
  multipartAbort: `${environment.apiUrl}/api/v1/storage/upload/multipart/abort`,
  downloadFile: (fileId: string) =>
    `${environment.apiUrl}/api/v1/storage/files/${fileId}/download`,
  createFolder: `${environment.apiUrl}/api/v1/storage/folders`,
  trashFile: (fileId: string) =>
    `${environment.apiUrl}/api/v1/storage/files/${fileId}`,
  trashFolder: (folderId: string) =>
    `${environment.apiUrl}/api/v1/storage/folders/${folderId}`,
  getTrashed: '${environment.apiUrl}/api/v1/storage/retrieve/trashed',
  restoreFile: (fileID: String) =>
    `${environment.apiUrl}/api/v1/restore/file/${fileID}`,
  restoreFolder: (folderID: String) =>
    `${environment.apiUrl}/api/v1/restore/file/${folderID}`,
  hardDeleteFile: (fileID: String) =>
    `${environment.apiUrl}/api/v1/remove/${fileID}`,
  hardDeleteFolder: (folderID: String) =>
    `${environment.apiUrl}/api/v1/remove/${folderID}`,
  emptyTrash: `${environment.apiUrl}/api/v1/trash/empty`,
};
