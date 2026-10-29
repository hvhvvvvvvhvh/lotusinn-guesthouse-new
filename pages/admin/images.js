import { adminRequest } from '../../lib/adminClient.js';
import { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import SiteImage from '../../components/SiteImage';
import { uploadImage } from '../../lib/imageUpload.js';


const sections = { images: 'Page banners & backgrounds', layout: 'Logo', home: 'Home page', about: 'About page', galleryPage: 'Gallery', roomsPage: 'Room cards', roomDetails: 'Room detail galleries' };
const friendly = slot => slot.label;

export default function WebsiteImages({ initialSlots }) {
  const [slots, setSlots] = useState(initialSlots);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [failed, setFailed] = useState(false);
  const open = slot => { setSelected(slot); setValue(slot.value); setNotice(''); setFailed(false); };
  const upload = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true); setNotice('Uploading and optimizing photo…');
    try { setValue(await uploadImage(file)); setFailed(false); setNotice('Photo ready. Click Save image to publish it.'); }
    catch (error) { setNotice(error.message); }
    finally { setBusy(false); event.target.value = ''; }
  };
  const save = async event => {
    event.preventDefault();
    setBusy(true); setNotice('Saving…');
    try {
      const response = await adminRequest('/api/admin/images', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selected.id, value: value.trim(), expectedHash: selected.expectedHash }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to save image.');
      setSlots(previous => previous.map(slot => slot.id === selected.id ? { ...slot, value: result.value, preview: result.value, expectedHash: result.expectedHash } : slot));
      setSelected(previous => ({ ...previous, value: result.value, preview: result.value, expectedHash: result.expectedHash }));
      setNotice('Image saved. Public pages will show it within one minute.');
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };
  const visible = slots.filter(slot => filter === 'all' || slot.path[0] === filter);
  return <AdminLayout title="Update the website’s photos, logos, banners and room galleries.">
    <div className="admin-header-row"><h1>Website Images</h1><a className="admin-btn admin-btn-outline" href="/" target="_blank" rel="noreferrer">View website</a></div>
    <p>Choose an image below. Upload a photo or paste an HTTPS image URL, preview it, then save. Uploads are resized and compressed automatically (JPG, PNG, WebP, AVIF or GIF, up to 3 MB).</p>
    <label className="image-section-filter">Page or section <select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All images</option>{Object.entries(sections).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    {selected && <form className="admin-panel image-editor" onSubmit={save} aria-label="Edit website image">
      <h2>{friendly(selected)}</h2>
      {!failed && (value || selected.preview) && <SiteImage loading="eager" sizes="(max-width: 900px) 100vw, 800px" src={value || selected.preview} alt="Selected image preview" onError={() => setFailed(true)} />}
      {failed && <p role="alert">This image could not be previewed. Check the URL or choose another photo.</p>}
      <div className="admin-field"><label htmlFor="website-image-url">Image URL</label><input id="website-image-url" required maxLength={2048} value={value} onChange={event => { setValue(event.target.value); setFailed(false); }} disabled={busy} /></div>
      <div className="admin-field"><label htmlFor="website-image-file">Upload replacement photo</label><input id="website-image-file" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" onChange={upload} disabled={busy} /></div>
      <div className="image-editor-actions"><button className="admin-btn" disabled={busy || !value.trim()} type="submit">{busy ? 'Please wait…' : 'Save image'}</button><button className="admin-btn admin-btn-outline" disabled={busy} type="button" onClick={() => { setSelected(null); setNotice(''); }}>Close editor</button></div>
      <p role="status" aria-live="polite">{notice}</p>
    </form>}
    <div className="website-images-grid">{visible.map(slot => <article className="admin-panel website-image-card" key={slot.id}>
      <SiteImage src={slot.preview || slot.value} alt={friendly(slot)} sizes="300px" />
      <h3>{friendly(slot)}</h3><button className="admin-btn" type="button" disabled={busy} onClick={() => { open(slot); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Change image<span className="sr-only">: {friendly(slot)}</span></button>
    </article>)}</div>
    <p>Blog featured images and author portraits can also be changed in their existing editors. Room cards and detail galleries have separate image locations.</p>
  </AdminLayout>;
}
