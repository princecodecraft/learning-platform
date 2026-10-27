"use client";
import { useState } from "react";\nimport type { ChangeEvent, FormEvent } from "react";
export default function VideoStudio() {
 const [file, setFile] = useState<File | null>(null);
 const [title, setTitle] = useState("");
 const [category, setCategory] = useState("JavaScript");
 const [description, setDescription] = useState("");
 const [message, setMessage] = useState("");
 const onFile = (event: ChangeEvent<HTMLInputElement>) => {
  const next = event.target.files?.[0] ?? null;
  setMessage("");
  if (!next) { setFile(null); return; }
  if (!next.type.startsWith("video/")) { setMessage("Please choose a video file."); event.target.value = ""; return; }
  if (next.size > 2 * 1024 * 1024 * 1024) { setMessage("This demo accepts files up to 2 GB. Use resumable uploads for larger videos."); event.target.value = ""; return; }
  setFile(next);
  if (!title) setTitle(next.name.replace(/\\.[^.]+$/, "").replace(/[-_]/g, " "));
 };
 const onSubmit = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  if (!file || !title.trim()) { setMessage("Add a video file and title to continue."); return; }
  setMessage("Your video is selected and the details are ready. To permanently upload and publish it, connect Cloudflare R2 storage and the authenticated upload API first. This form does not send the video to a server yet.");
 };
 return <section className="panel-card upload-panel" id="upload"><div className="panel-heading"><div><h2>Upload a new video</h2><p>Add a lesson to your library and prepare it for publishing.</p></div><span className="quick-star">✦</span></div><form onSubmit={onSubmit}><label className={"upload-zone"+(file?" has-file":"")}><span className="upload-symbol">↑</span><strong>{file ? "Video selected" : "Drop your video here or browse"}</strong><p>MP4, MOV or WebM · Up to 2 GB in this demo<br/><span>Choose a file from your computer</span></p>{file && <span className="upload-file-name">{file.name} · {(file.size / (1024*1024)).toFixed(1)} MB</span>}<input type="file" accept="video/mp4,video/quicktime,video/webm,video/*" onChange={onFile}/></label><div className="upload-fields"><div className="field full"><label htmlFor="video-title">Video title</label><input id="video-title" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Understanding the JavaScript Event Loop" maxLength={140}/></div><div className="field"><label htmlFor="video-category">Course / category</label><select id="video-category" value={category} onChange={e=>setCategory(e.target.value)}><option>JavaScript</option><option>React</option><option>Node.js</option><option>TypeScript</option><option>System Design</option><option>AI & RAG</option><option>Other</option></select></div><div className="field"><label htmlFor="video-visibility">Visibility</label><select id="video-visibility" defaultValue="Draft"><option>Draft</option><option>Published</option><option>Private</option></select></div><div className="field full"><label htmlFor="video-description">Short description</label><textarea id="video-description" value={description} onChange={e=>setDescription(e.target.value)} placeholder="What will learners understand after this lesson?" maxLength={600}/></div></div><div className="upload-submit-row"><span className="upload-hint">Your content stays private until storage and publishing are configured.</span><button className="upload-submit" type="submit">Prepare video <span>→</span></button></div>{message && <div className="upload-message" role="status">{message}</div>}</form></section>;
}
