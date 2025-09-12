"use client";

import { useState, ChangeEvent, useEffect } from "react";
import { supabase } from "../lib/supabase";
import styles from "./page.module.css"; // Import the CSS module

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("画像をアップロードしてください");
  
  // New state to hold the list of all image URLs
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Function to fetch all images from the bucket
  const fetchImages = async () => {
    // List all files in the 'images' bucket inside the 'public' folder
    const { data: files, error } = await supabase.storage
      .from("images")
      .list("public", {
        limit: 100, // You can adjust the limit
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) {
      console.error("Error fetching images:", error);
      return;
    }

    // Create public URLs for each file
    const urls = files.map((file) => {
      return supabase.storage.from("images").getPublicUrl(`public/${file.name}`).data.publicUrl;
    });

    setImageUrls(urls);
  };

  // useEffect runs once when the component loads
  useEffect(() => {
    fetchImages();
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage("ファイルが選択されました");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("ファイルが選択されていません");
      return;
    }

    setIsUploading(true);
    setMessage("アップロード中...");
    
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `public/${Date.now()}_${safeFileName}`;

    const { data, error } = await supabase.storage
      .from("images")
      .upload(filePath, file);

    if (error) {
      console.error("Upload error:", error);
      setMessage("アップロードに失敗しました");
      setIsUploading(false);
      return;
    }

    setMessage("アップロードが完了しました！");
    setIsUploading(false);

    // After a successful upload, refresh the image list to show the new one
    fetchImages(); 
  };

  return (
    <main style={{ textAlign: "center", padding: "2rem" }}>
      {/* 1. Title */}
      <h1>メタ認知図鑑</h1>
      <p>あなたの「好き」なものを写真に撮って集めよう！</p>
      
      {/* 2. Upload Section */}
      <div style={{ margin: "2rem 0" }}>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={isUploading} style={{ marginLeft: "1rem" }}>
          {isUploading ? "処理中..." : "アップロード"}
        </button>
        <p style={{ marginTop: "1rem" }}>{message}</p>
      </div>

      <hr />

      {/* 3. Image Gallery */}
      <h2>みんなが見つけた「好き」</h2>
      <div className={styles.galleryContainer}>
        {/* We duplicate the content to create a seamless loop */}
        <div className={styles.marqueeContent}>
          {[...imageUrls, ...imageUrls].map((url, index) => (
            <img key={index} src={url} alt={`Uploaded image ${index}`} className={styles.galleryImage} />
          ))}
        </div>
      </div>
    </main>
  );
}