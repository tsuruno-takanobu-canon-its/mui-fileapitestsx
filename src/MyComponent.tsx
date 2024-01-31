import React, {
  useContext,
  useEffect,
  useCallback,
  useState,
  DragEventHandler,
  DragEvent,
} from "react";
import "./styles.css";
import { Button, Radio, FormControlLabel, Box, Tooltip } from "@mui/material";
import { useDropzone } from "react-dropzone";

// ArrayBufferTobase64
// @see https://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string
// @see https://zenn.dev/takaodaze/articles/74ac1684a7d1d2
const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  var binary = "";
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};
const base64ToArrayBuffer = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

const readFile = async (blob: Blob) => {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onabort = () => reject("file reading was aborted");
    reader.onerror = () => reject("file reading has failed");
    reader.onload = () => {
      const result = reader.result;
      if (result instanceof ArrayBuffer) {
        resolve(result);
      } else {
        reject("file reading has failed");
      }
    };
    reader.readAsArrayBuffer(blob);
  });
};
const readBlobAsDataURL = async (blob: Blob): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result == "string") {
        resolve(reader.result);
      } else {
        reject(new Error("file reading has failed"));
      }
    };
    reader.onerror = () => {
      reader.abort();
      reject(new Error("file reading has failed"));
    };
    reader.readAsDataURL(blob);
  });
};
const getBase64 = async (blob: Blob): Promise<string> => {
  try {
    const base64 = await readBlobAsDataURL(blob);
    console.log(base64);
    return base64;
  } catch (err) {
    console.log(err);
    return "";
  }
};
const useBlobFile = (blob: Blob, filename: string) => {
  // const [file, setFile] = useState(blob);
  const [contentBase64, setContentBase64] = useState<string>();
  const [_, setBlob] = useState<Blob>();

  setBlob(blob);

  const loadData = async (blob: Blob) => {
    const buf = await readFile(blob);
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
  const append = async (file: File) => {
    const fileSize = file.size;
    const filename = file.name;
    const base64 = await getBase64(file);
    const newFile: UploadFileType = { file, filename, fileSize, base64 };
    setFiles((prev) => [...prev, newFile]);
  };
  const clear = () => {
    setFiles([]);
  };
  const showFileContents = () => {
    files.map((file) => {
      readBlobAsDataURL(file.file).then((base64) => {
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
    link.href = content;
    link.download = filename;
    link.click();
  };
  // const dummy = "44GT44KM44GvDQrjg4bjgrnjg4gNCuOBp+OBmQ==";
  return (
    <div>
      <span>{filename}</span>
      {
        // リンクでダウロードする場合
        <a href={contentBase64} download={filename}>
          ダウンロード
        </a>
      }
      <Button
        onClick={() => {
          // ボタンでダウンロードする場合
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
      console.log(`append ${file.name}, ${file.size}, ${file.type}`);
      append(file);
    });
  }, []);
  const onDragOver = useCallback((e: DragEvent<HTMLElement>) => {
    console.log("onDragOver");
    e.preventDefault();
    const items = e.dataTransfer?.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i].webkitGetAsEntry();
      if (item && item.isDirectory) {
        console.log("item is directory");
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    // onDragOver,
  });

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
            <div key={index}>
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
