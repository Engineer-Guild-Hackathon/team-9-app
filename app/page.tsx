"use client";

import { useState, ChangeEvent } from "react";
import { supabase } from "../lib/supabase"; // Supabaseクライアントをインポート

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadURL, setDownloadURL] = useState<string | null>(null);
  const [message, setMessage] = useState("画像をアップロードしてください");

  // ファイルが選択された時の処理
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage("ファイルが選択されました");
      setDownloadURL(null); // 新しいファイルが選ばれたら前の画像を消す
    }
  };

  // アップロードボタンが押された時の処理
  const handleUpload = async () => {
    if (!file) {
      setMessage("ファイルが選択されていません");
      return;
    }

    setIsUploading(true);
    setMessage("アップロード中...");

    //  ファイル名を安全な名前に変換する処理を追加
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    //  新しいファイル名でパスを作成
    const filePath = `public/${Date.now()}_${safeFileName}`;

    // Supabase Storageにアップロード
    const { data, error } = await supabase.storage
      .from("images") // 作成したバケット名
      .upload(filePath, file);

    if (error) {
      console.error("Upload error:", error);
      setMessage("アップロードに失敗しました");
      setIsUploading(false);
      return;
    }

    // アップロードしたファイルの公開URLを取得
    const { data: urlData } = supabase.storage
      .from("images")
      .getPublicUrl(data.path);

    setDownloadURL(urlData.publicUrl);
    setMessage("アップロードが完了しました！");
    setIsUploading(false);
  };

  return (
    <main style={{ padding: "2rem" }}>
      <h1>画像アップロード (Supabase)</h1>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={isUploading} style={{ marginLeft: "1rem" }}>
        {isUploading ? "処理中..." : "アップロード"}
      </button>
      <div style={{ marginTop: "1rem" }}>
        <p>{message}</p>
      </div>
      {downloadURL && (
        <div style={{ marginTop: "1rem" }}>
          <p>アップロードした画像:</p>
          <img src={downloadURL} alt="Uploaded" style={{ maxWidth: "300px" }} />
        </div>
      )}
    </main>
  );
}