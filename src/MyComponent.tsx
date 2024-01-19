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

function readFile(blob: Blob, onload) {
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
type UploadFileType = {
  blob: blob;
  base64: string;
  buff: ArrayBuffer;
};

const useUploadFile = (blob: Blob) => {
  const [file, setFile] = useState(blob);
  const [content, setContent] = useState<string>();
  const [arrayBuffer, setArrayBuffer] = useState<ArrayBuffer>();
  const onload = (event: ProgressEvent<FileReader>) => {
    const binaryStr = event.target?.result;
    if (binaryStr instanceof ArrayBuffer) {
      setArrayBuffer(binaryStr);
      const base64String = arrayBufferToBase64(binaryStr);
      console.log(base64String);
      setContent(base64String);
    }
  };
  readFile(file, onload);

  return { filename: file.name, arrayBuffer, content };
};

const useFileMgr = () => {
  [files, setFiles] = useState<UploadFileType[]>([]);
  const append = (file) => {
    const newFiles = [...files, { file }];
    console.log(newFiles);
    setFiles(newFiles);
  };
  return { files, append };
};

const FileItem = ({ file }: { file: Blob }) => {
  const { filename, content } = useUploadFile(file);
  const downloadBase64File = (content: string, filename: string) => {
    const link = document.createElement("a");
    link.href = `data:application/octet-stream;base64,${content}`;
    link.download = filename;
    link.click();
  };
  const dummy = "44GT44KM44GvDQrjg4bjgrnjg4gNCuOBp+OBmQ==";
  return (
    <div>
      <div>{filename}</div>
      {
        <a
          href={`data:application/octet-stream;base64,${dummy}`}
          download={filename}
        >
          {filename}
        </a>
      }
    </div>
  );
};

// @see https://react-dropzone.js.org/
export default function MyComponent() {
  const { files, append } = useFileMgr();
  const onDrop = useCallback((acceptedFiles) => {
    console.log(acceptedFiles);
    acceptedFiles.forEach((file) => {
      console.log(`append ${file.path}`);
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
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag 'n' drop some files here, or click to select files</p>
        )}
      </div>
      <div>
        count={files.length}
        {files.map((file, index) => (
          <FileItem key={index} file={file} />
        ))}
      </div>
    </div>
  );
}
