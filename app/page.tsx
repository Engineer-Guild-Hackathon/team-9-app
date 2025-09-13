"use client";

import { useState, ChangeEvent, useEffect } from "react";
import { supabase } from "../lib/supabase";
import styles from "./page.module.css"; // Import the CSS module

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("画像をアップロードしてください");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState("");
  
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
    setIsUploading(false);
  };

  const handleAnalyze = async () => {
    if (imageUrls.length === 0) {
      setAnalysisResult("先に写真をアップロードしてね！");
      return;
    }
    setIsAnalyzing(true);
    setAnalysisResult("AIが分析中...");

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrls }),
      });

      if (!response.ok) {
        throw new Error('Analysis request failed');
      }

      const data = await response.json();
      setAnalysisResult(data.analysis);
    } catch (error) {
      console.error(error);
      setAnalysisResult("分析に失敗しました。もう一度試してください。");
    }

    setIsAnalyzing(false);
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

      {/* New Analysis Section */}
      <div style={{ margin: "2rem 0", padding: "1.5rem", backgroundColor: "#eef2ff", borderRadius: "8px" }}>
        <h2>AIによる「好き」の分析</h2>
        <p>ギャラリーの写真から、あなたの興味をAIが教えてくれるよ。</p>
        <button onClick={handleAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? "考え中..." : "わたしの「好き」を分析して！"}
        </button>
        {analysisResult && (
          <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "white", borderRadius: "4px" }}>
            <p style={{ whiteSpace: "pre-wrap" }}>{analysisResult}</p>
          </div>
        )}
      </div>
    </main>
  );
}