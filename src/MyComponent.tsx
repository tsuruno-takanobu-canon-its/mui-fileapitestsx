import React, { useContext, useEffect, useCallback, useState } from "react";
import "./styles.css";
import { Button, Radio, FormControlLabel, Box, Tooltip } from "@mui/material";
import { useDropzone } from "react-dropzone";

// ArrayBufferTobase64
// @see https://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string
// @see https://zenn.dev/takaodaze/articles/74ac1684a7d1d2
function arrayBufferToBase64(buffer: ArrayBuffer) {
  var binary = "";
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
function base64ToArrayBuffer(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function readFile(
  blob: Blob,
  onload: (event: ProgressEvent<FileReader>) => void
) {
  const reader = new FileReader();
  console.log(`blob=${blob}`);
  if (blob instanceof Blob) {
    reader.onabort = () => console.log("file reading was aborted");
    reader.onerror = () => console.log("file reading has failed");
    reader.onload = onload;
    reader.readAsArrayBuffer(blob);
  }
  return reader;
}
async function readFileAsDataURL(blob: Blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onabort = () => reject(reader.error);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
async function getBase64(blob: Blob) {
  try {
    const base64 = await readFileAsDataURL(blob);
    return base64;
  } catch (err) {
    console.log(err);
  }
}
const useBlobFile = (blob: Blob, filename: string) => {
  // const [file, setFile] = useState(blob);
  const [contentBase64, setContentBase64] = useState<string>();
  const [_, setBlob] = useState<Blob>();

  setBlob(blob);

  const loadData = async (blob: Blob) => {
    const buf = await readFileAsDataURL(blob);
    if (buf instanceof ArrayBuffer) {
      const base64str = arrayBufferToBase64(buf);
      setContentBase64(base64str);
    }
  };
  useEffect(() => {
    loadData(blob);
  }, []);

  return { filename, contentBase64 };
};

type UploadFileType = {
  file: File;
  filename?: string;
  fileSize?: number;
  base64?: string;
};

const useUploadFileMgr = () => {
  const [files, setFiles] = useState<UploadFileType[]>([]);
  const append = (file: File) => {
    const fileSize = file.size;
    const filename = file.name;
    const newFiles: UploadFileType[] = [...files, { file, filename, fileSize }];
    setFiles(newFiles);
  };
  const clear = () => {
    setFiles([]);
  };
  const showFileContents = () => {
    files.map((file) => {
      readFileAsDataURL(file.file).then((base64) => {
        console.log(base64);
      });
    });
  };
  return { files, append, clear, showFileContents };
};

const DownloadableItem = ({
  filename,
  contentBase64,
}: {
  filename: string;
  contentBase64: string;
}) => {
  const downloadBase64File = (content: string, filename: string) => {
    const link = document.createElement("a");
    link.href = `data:application/octet-stream;base64,${content}`;
    link.download = filename;
    link.click();
  };
  // const dummy = "44GT44KM44GvDQrjg4bjgrnjg4gNCuOBp+OBmQ==";
  return (
    <div>
      <span>{filename}</span>
      {
        <a
          href={`data:application/octet-stream;base64,${contentBase64}`}
          download={filename}
        >
          ダウンロード
        </a>
      }
      <Button
        onClick={() => {
          downloadBase64File(contentBase64, filename);
        }}
      >
        download
      </Button>
    </div>
  );
};

// @see https://react-dropzone.js.org/
export default function MyComponent() {
  const { files: uploadfiles, append, clear } = useUploadFileMgr();
  const [downloadfile, setDownloadfile] = useState<
    { content: string; filename: string }[]
  >([]);
  const uploadHandler = () => {
    const files: { content: string; filename: string }[] = [];
    uploadfiles.forEach((file) => {
      console.log(file);
      const content = file.base64 || "";
      const filename = file.filename || "";
      files.push({ content, filename });
    });
    setDownloadfile(files);
    clear();
  };
  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log(acceptedFiles);
    acceptedFiles.forEach((file) => {
      console.log(`append ${file.name}`);
      append(file);
    });
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div>
      <div
        {...getRootProps()}
        style={{ backgroundColor: "lightblue", height: 100 }}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>ドロップしてください ...</p>
        ) : (
          <p>
            ここにファイルをドラッグアンドドロップするか,
            クリックしてファイルを選択してください。
          </p>
        )}
      </div>
      <div>
        count={uploadfiles.length}
        {uploadfiles.map((file, index) => {
          return (
            <div>
              <span>{file.filename}</span>
              <span>{file.fileSize}</span>
            </div>
          );
        })}
      </div>
      <div>
        <Button name="button" onClick={uploadHandler}>
          アップロードする
        </Button>
      </div>
      <div>
        {downloadfile.map((b, index) => (
          <DownloadableItem
            key={index}
            filename={b.filename}
            contentBase64={b.content}
          />
        ))}
      </div>
    </div>
  );
}
