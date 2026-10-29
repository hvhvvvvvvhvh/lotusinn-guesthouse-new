import { adminRequest } from '../../../lib/adminClient.js';
import SiteImage from '../../../components/SiteImage';
import { useRouter } from 'next/router';
import { uploadImage } from '../../../lib/imageUpload.js';
import { useState } from 'react';
import Link from 'next/link';
import AdminLayout from '../../../components/AdminLayout';

const blank = {
  title: '', slug: '', authorId: '', category: 'Travel Guide',
  publishDate: new Date().toISOString().slice(0, 10), status: 'Draft',
  excerpt: '', metaTitle: '', keywords: '', metaDescription: '', featuredImage: ''
};

const newBlock = (type = 'paragraph') => ({
  id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  type, text: '', title: '', items: [''], url: '', label: '', question: '', answer: '', alt: ''
});



function makeSlug(value = '') {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);
}

const readImage = uploadImage;

export default function NewBlog({ authors, initialBlog }) {
  const router = useRouter();
  const [form, setForm] = useState(() => initialBlog ? { ...blank, ...initialBlog } : blank);
  const [blocks, setBlocks] = useState(() => initialBlog?.blocks?.length
    ? initialBlog.blocks.map((b, i) => ({ ...newBlock(b.type), ...b, id: b.id || `block-${i}` }))
    : [newBlock()]);
  const [notice, setNotice] = useState({ type: '', message: '' });
  const [saving, setSaving] = useState(false);

  const set = (name, value) => setForm((p) => ({ ...p, [name]: value }));
  const updateBlock = (id, patch) => setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, ...patch } : b));
  const addBlock = (type) => setBlocks((prev) => [...prev, newBlock(type)]);
  const removeBlock = (id) => setBlocks((prev) => prev.length > 1 ? prev.filter((b) => b.id !== id) : prev);
  const moveBlock = (index, dir) => setBlocks((prev) => {
    const next = [...prev], target = index + dir;
    if (target < 0 || target >= next.length) return prev;
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });

  const chooseFeaturedImage = async (file) => {
    if (!file) return;
    try {
      const data = await readImage(file);
      set('featuredImage', data);
      setNotice({ type: 'success', message: 'Featured image selected and optimized.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    }
  };

  const chooseBlockImage = async (id, file) => {
    if (!file) return;
    try {
      const data = await readImage(file, 1600, 0.8);
      updateBlock(id, { url: data });
      setNotice({ type: 'success', message: 'Content image selected and optimized.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    }
  };

  const importDraft = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setBlocks([{ ...newBlock('paragraph'), text: String(reader.result || '') }]);
      setNotice({ type: 'success', message: 'Draft imported into the first paragraph block.' });
    };
    reader.readAsText(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setNotice({ type: '', message: '' });

    const payload = {
      ...form,
      blocks: blocks.map(({ id, ...b }) => b),
      id: initialBlog?.id,
      createdAt: initialBlog?.createdAt,
      slug: form.slug || makeSlug(form.title)
    };

    if (!payload.title.trim()) return setNotice({ type: 'error', message: 'Blog title is required.' });
    if (!payload.authorId) return setNotice({ type: 'error', message: 'Please select an author before saving the blog.' });
    if (!payload.slug) return setNotice({ type: 'error', message: 'Please enter a valid slug or blog title.' });

    try {
      setSaving(true);
      const res = await adminRequest('/api/admin/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Blog could not be saved (${res.status}).`);
      setNotice({ type: 'success', message: payload.status === 'Published' ? 'Blog published successfully.' : 'Blog saved successfully.' });
      await router.push('/admin/blogs');
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'Unable to save blog. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return <AdminLayout title={initialBlog ? 'Edit an existing article and update its content or SEO metadata.' : 'Manage editorial content'} contentSection>
    <form onSubmit={submit}>
      <div className="content-page-header">
        <div><span className="eyebrow">CONTENT MANAGEMENT</span><h1>{initialBlog ? 'Edit Blog Post' : 'Create a New Blog Post'}</h1><p>Draft a new article, upload featured media, and configure SEO metadata before publishing.</p></div>
        <div className="header-actions"><Link className="content-secondary-btn" href="/admin/blogs">Cancel</Link><button className="content-primary-btn" type="submit" disabled={saving}>{saving ? 'Saving…' : form.status === 'Published' ? 'Publish Blog' : 'Save Blog'}</button></div>
      </div>

      <section className="content-card import-card">
        <div><span className="eyebrow">QUICK START</span><h2>Import from Microsoft Word</h2><p>Creates an editable draft from headings, paragraphs, lists, links, embedded images, document properties, and automatically generated SEO metadata.</p></div>
        <label className="upload-btn">Choose .docx file<input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" /></label>
      </section>

      {notice.message && <div className={`content-alert ${notice.type}`} role="status">{notice.message}</div>}

      <section className="content-card">
        <div className="section-heading"><span className="eyebrow">POST SETUP</span><h2>{initialBlog ? 'Edit Blog Post' : 'Create New Blog Post'}</h2><p className="section-help">{initialBlog ? 'Update the article details, publishing status and summary below.' : ''}</p></div>
        <div className="content-form-grid">
          <Field label="Author"><select value={form.authorId} onChange={(e) => set('authorId', e.target.value)}><option value="">Select author</option>{authors.map(a => <option key={a.id} value={a.id}>{a.name} — {a.role}</option>)}</select></Field>
          <Field label="Blog Title"><input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Best Places to Visit in Mirpur, AJK" /></Field>
          <Field label="Slug"><input value={form.slug} onChange={(e) => set('slug', makeSlug(e.target.value))} placeholder="best-places-to-visit-in-mirpur" /></Field>
          <Field label="Category"><input value={form.category} onChange={(e) => set('category', e.target.value)} /></Field>
          <Field label="Publish Date"><input type="date" value={form.publishDate} onChange={(e) => set('publishDate', e.target.value)} /></Field>
          <Field label="Status"><select value={form.status} onChange={(e) => set('status', e.target.value)}><option>Draft</option><option>Published</option></select></Field>
          <Field full label="Excerpt"><textarea value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} placeholder="Short summary shown on the blog listing and social previews." /></Field>
        </div>
      </section>

      <section className="content-card">
        <div className="section-heading"><span className="eyebrow">SEO & FEATURED MEDIA</span><h2>Search Metadata</h2></div>
        <div className="content-form-grid">
          <Field label="Meta Title"><input value={form.metaTitle} onChange={(e) => set('metaTitle', e.target.value)} /></Field>
          <Field label="Keywords"><input value={form.keywords} onChange={(e) => set('keywords', e.target.value)} placeholder="lotus inn, mirpur hotel, ajk travel" /></Field>
          <Field full label="Meta Description"><textarea value={form.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} /></Field>
          <Field full label="Featured Image Path / URL"><input value={form.featuredImage} onChange={(e) => set('featuredImage', e.target.value)} placeholder="/images/blogs/example.jpg" /></Field>
          <div className="upload-zone">
            <div className="upload-zone-head"><strong></strong><span></span></div>
            <label className="image-upload-button">Choose Featured Image<input type="file" accept="image/*" onChange={(e) => chooseFeaturedImage(e.target.files?.[0])} /></label>
            {form.featuredImage && <SiteImage src={form.featuredImage} alt="Featured preview" />}
          </div>
        </div>
      </section>

      <section className="content-card">
        <div className="builder-heading">
          <div><span className="eyebrow">ARTICLE BUILDER</span><h2>Content Blocks</h2><p className="builder-help"></p></div>
          <div className="block-buttons">{['paragraph','heading2','heading3','bullet','numbered','link','image','faq'].map(type => <button type="button" key={type} onClick={() => addBlock(type)}>+ {labelFor(type)}</button>)}</div>
        </div>
        <div className="block-list">{blocks.map((block, index) => <BlockEditor key={block.id} block={block} index={index} update={updateBlock} remove={removeBlock} move={moveBlock} chooseImage={chooseBlockImage} />)}</div>
        <div className="builder-add"><span>Add next block from here</span><div className="block-buttons">{['paragraph','heading2','heading3','bullet','numbered','link','image','faq'].map(type => <button type="button" key={type} onClick={() => addBlock(type)}>+ {labelFor(type)}</button>)}</div></div>
      </section>
    </form>
  </AdminLayout>;
}

function Field({ label, children, full }) { return <div className={full ? 'form-field full' : 'form-field'}><label>{label}</label>{children}</div>; }
function labelFor(t) { return ({ paragraph:'Paragraph', heading2:'Heading 2', heading3:'Heading 3', bullet:'Bullet List', numbered:'Numbered List', link:'Link / CTA', image:'Image', faq:'FAQ' })[t]; }

function BlockEditor({ block, index, update, remove, move, chooseImage }) {
  const common = (patch) => update(block.id, patch);
  return <div className={`editor-block editor-block-${block.type}`}>
    <div className="editor-block-head"><div><span className="block-number">{}</span><strong>{labelFor(block.type)}</strong></div><div className="editor-block-actions"><button type="button" onClick={() => move(index, -1)} disabled={index === 0}>Up</button><button type="button" onClick={() => move(index, 1)}>Down</button><button className="danger" type="button" onClick={() => remove(block.id)}>Remove</button></div></div>
    {['paragraph','heading2','heading3'].includes(block.type) && <textarea value={block.text} onChange={e => common({ text:e.target.value })} placeholder={block.type === 'paragraph' ? 'Write paragraph content...' : 'Enter heading...'} />}
    {['bullet','numbered'].includes(block.type) && <textarea value={(block.items || ['']).join('\n')} onChange={e => common({ items:e.target.value.split('\n') })} placeholder="One list item per line" />}
    {block.type === 'link' && <div className="content-form-grid"><Field label="Button / Link Text"><input value={block.label} onChange={e => common({ label:e.target.value })} placeholder="Learn more" /></Field><Field label="URL"><input value={block.url} onChange={e => common({ url:e.target.value })} placeholder="https://example.com" /></Field></div>}
    {block.type === 'image' && <div className="image-block-editor">
      <div className="content-form-grid"><Field label="Image URL"><input value={block.url} onChange={e => common({ url:e.target.value })} placeholder="/images/blogs/example.jpg or uploaded image" /></Field><Field label="Alt Text"><input value={block.alt} onChange={e => common({ alt:e.target.value })} placeholder="Describe the image for SEO and accessibility" /></Field></div>
      <div className="inline-image-upload"><label className="image-upload-button">Upload / Choose Image<input type="file" accept="image/*" onChange={e => chooseImage(block.id, e.target.files?.[0])} /></label><span>Upload an image for this content block</span></div>
      {block.url && <div className="content-image-preview"><SiteImage src={block.url} alt={block.alt || 'Content preview'} /><button type="button" onClick={() => common({ url:'' })}>Remove image</button></div>}
    </div>}
    {block.type === 'faq' && <div className="content-form-grid"><Field label="Question"><input value={block.question} onChange={e => common({ question:e.target.value })} placeholder="Frequently asked question" /></Field><Field full label="Answer"><textarea value={block.answer} onChange={e => common({ answer:e.target.value })} placeholder="Helpful answer for your reader" /></Field></div>}
  </div>;
}
