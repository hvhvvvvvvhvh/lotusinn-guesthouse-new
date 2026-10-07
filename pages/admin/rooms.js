import { useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { filePaths, readJson } from '../../lib/dataStore';

export async function getServerSideProps() {
  const roomsData = await readJson(filePaths.rooms);
  return { props: { initialData: roomsData } };
}

const emptyForm = {
  slug:'',
  tag:'Deluxe',
  title:'',
  text:'',
  price:'',
  image:'',
  roomNumber:'',
  availability:'Available',
  detailName:'',
  heroSubtitle:'',
  desc:''
};

const defaultImage = 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85';
const defaultIcons = [
  { icon:'fa-solid fa-wifi', label:'Free Wi-Fi' },
  { icon:'fa-solid fa-snowflake', label:'Air Conditioning' },
  { icon:'fa-solid fa-car', label:'Parking' }
];
const defaultFacilities = ['Free Wi-Fi', 'Air Conditioning', 'Attached Bathroom', 'LED TV'];
const defaultAmenities = ['Complimentary toiletries', 'Coffee/tea setup', 'Bottled water', 'Housekeeping'];
const defaultReviews = [{ rating:'⭐⭐⭐⭐⭐', text:'Excellent room and peaceful stay.', name:'Guest Review' }];

export default function RoomsAdmin({ initialData }) {
  const [roomsData, setRoomsData] = useState(initialData);
  const [form, setForm] = useState(emptyForm);
  const [editingSlug, setEditingSlug] = useState('');
  const [status, setStatus] = useState({ type:'', message:'' });

  const availableRooms = roomsData?.roomsPage?.availableRooms || [];
  const masterRooms = roomsData?.roomsPage?.masterRooms || [];

  const previewCard = useMemo(() => ({
    image: form.image || defaultImage,
    tag: form.tag || 'Deluxe',
    title: form.title || 'Room Preview',
    text: form.text || 'Your room summary will appear here.',
    price: form.price || 'Rs 0 / night',
    availability: form.availability || 'Available',
    roomNumber: form.roomNumber || 'New'
  }), [form]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus({ type:'error', message:'Please select a valid image file.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, image: String(reader.result || '') }));
      setStatus({ type:'success', message:'Image uploaded successfully. Save the room to keep it.' });
    };
    reader.onerror = () => setStatus({ type:'error', message:'Image upload failed. Please try another image.' });
    reader.readAsDataURL(file);
  };

  const saveAll = async (nextData) => {
    const res = await fetch('/api/admin/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nextData)
    });
    if (!res.ok) throw new Error('Save failed');
  };

  const buildCard = (currentForm, slug) => ({
    image: currentForm.image || defaultImage,
    tag: currentForm.tag,
    title: currentForm.title,
    description: currentForm.text || 'Comfortable stay with premium facilities.',
    text: currentForm.text || 'Comfortable stay with premium facilities.',
    price: currentForm.price,
    slug,
    roomNumber: currentForm.roomNumber || '',
    availability: currentForm.availability || 'Available',
    iconOnly: ['fa-solid fa-wifi','fa-solid fa-snowflake','fa-solid fa-car','fa-solid fa-bell-concierge'],
    badges: [
      { icon:'fa-solid fa-wifi', label:'Wi-Fi' },
      { icon:'fa-solid fa-snowflake', label:'AC' },
      { icon:'fa-solid fa-car', label:'Parking' }
    ]
  });

  const buildDetail = (currentForm) => ({
    name: currentForm.detailName || currentForm.title,
    heroSubtitle: currentForm.heroSubtitle || 'Premium comfort at Lotus Inn Guest House.',
    images: [currentForm.image || defaultImage],
    icons: defaultIcons,
    desc: currentForm.desc || currentForm.text || 'Well-designed room with comfort-focused amenities.',
    facilities: defaultFacilities,
    amenities: defaultAmenities,
    reviews: defaultReviews,
    price: currentForm.price,
    availability: currentForm.availability || 'Available',
    roomNumber: currentForm.roomNumber || ''
  });

  const resetEditor = () => {
    setForm(emptyForm);
    setEditingSlug('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const slug = (form.slug.trim() || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/(^-|-$)/g, '');
      if (!form.title || !form.price) {
        setStatus({ type:'error', message:'Room title and price are required.' });
        return;
      }

      const card = buildCard(form, slug);
      const detail = buildDetail(form);
      const filteredAvailable = availableRooms.filter((room) => room.slug !== editingSlug && room.slug !== slug);
      const filteredMaster = masterRooms.filter((room) => room.slug !== editingSlug && room.slug !== slug);

      const nextData = {
        ...roomsData,
        roomsPage: {
          ...roomsData.roomsPage,
          availableRooms: [card, ...filteredAvailable],
          masterRooms: [card, ...filteredMaster].slice(0, Math.max(filteredMaster.length + 1, 3))
        },
        roomDetails: {
          ...roomsData.roomDetails,
          ...(editingSlug && editingSlug !== slug ? { [editingSlug]: undefined } : {}),
          [slug]: detail
        }
      };
      if (editingSlug && editingSlug !== slug) delete nextData.roomDetails[editingSlug];

      await saveAll(nextData);
      setRoomsData(nextData);
      setStatus({ type:'success', message: editingSlug ? 'Room updated successfully.' : 'Room added successfully.' });
      resetEditor();
    } catch (error) {
      console.error(error);
      setStatus({ type:'error', message:'Room could not be saved.' });
    }
  };

  const handleEdit = (slug) => {
    const room = availableRooms.find((item) => item.slug === slug);
    const detail = roomsData?.roomDetails?.[slug] || {};
    if (!room) return;
    setForm({
      slug: room.slug || '',
      tag: room.tag || 'Deluxe',
      title: room.title || '',
      text: room.description || room.text || '',
      price: room.price || '',
      image: room.image || '',
      roomNumber: room.roomNumber || detail.roomNumber || '',
      availability: room.availability || detail.availability || 'Available',
      detailName: detail.name || room.title || '',
      heroSubtitle: detail.heroSubtitle || '',
      desc: detail.desc || room.description || room.text || ''
    });
    setEditingSlug(slug);
    setStatus({ type:'', message:'' });
  };

  const handleDelete = async (slug) => {
    try {
      const filteredAvailable = availableRooms.filter((room) => room.slug !== slug);
      const filteredMaster = masterRooms.filter((room) => room.slug !== slug);
      const details = { ...roomsData.roomDetails };
      delete details[slug];
      const nextData = {
        ...roomsData,
        roomsPage: {
          ...roomsData.roomsPage,
          availableRooms: filteredAvailable,
          masterRooms: filteredMaster
        },
        roomDetails: details
      };
      await saveAll(nextData);
      setRoomsData(nextData);
      if (editingSlug === slug) resetEditor();
      setStatus({ type:'success', message:'Room removed successfully.' });
    } catch (error) {
      console.error(error);
      setStatus({ type:'error', message:'Room could not be removed.' });
    }
  };

  return (
    <AdminLayout title="Add, preview, edit and manage guest house rooms without changing your public design.">
      <div className="admin-grid">
        <div className="admin-panel">
          <div className="admin-header-row">
            <h3>{editingSlug ? 'Edit Room' : 'Add New Room'}</h3>
            {editingSlug ? <button type="button" className="admin-btn admin-btn-outline" onClick={resetEditor}>Cancel Edit</button> : null}
          </div>
          <form className="admin-form-grid" onSubmit={handleSubmit}>
            <div className="admin-field"><label>Room Title</label><input name="title" value={form.title} onChange={handleChange} placeholder="Executive Room" /></div>
            <div className="admin-field"><label>Price</label><input name="price" value={form.price} onChange={handleChange} placeholder="Rs 8,000 / night" /></div>
            <div className="admin-field"><label>Slug</label><input name="slug" value={form.slug} onChange={handleChange} placeholder="executive-room" /></div>
            <div className="admin-field"><label>Tag</label><select name="tag" value={form.tag} onChange={handleChange}><option>Deluxe</option><option>Family</option><option>Standard</option><option>Executive</option><option>Premium</option></select></div>
            <div className="admin-field"><label>Room Number</label><input name="roomNumber" value={form.roomNumber} onChange={handleChange} placeholder="101" /></div>
            <div className="admin-field"><label>Availability</label><select name="availability" value={form.availability} onChange={handleChange}><option>Available</option><option>Booked</option><option>Maintenance</option><option>Hold</option></select></div>
            <div className="admin-field admin-field-full"><label>Image URL</label><input name="image" value={form.image} onChange={handleChange} placeholder="https://... or upload from device" /></div>
            <div className="admin-field admin-field-full"><label>Upload Image From Device</label><input type="file" accept="image/*" onChange={handleImageUpload} /></div>
            <div className="admin-field admin-field-full"><label>Short Description</label><textarea name="text" value={form.text} onChange={handleChange} placeholder="Short room summary for cards" /></div>
            <div className="admin-field admin-field-full"><label>Detail Page Description</label><textarea name="desc" value={form.desc} onChange={handleChange} placeholder="Room detail description" /></div>
            <div className="admin-field"><label>Detail Name</label><input name="detailName" value={form.detailName} onChange={handleChange} placeholder="Executive Room" /></div>
            <div className="admin-field"><label>Hero Subtitle</label><input name="heroSubtitle" value={form.heroSubtitle} onChange={handleChange} placeholder="Modern comfort in Mirpur" /></div>
            <div className="admin-field admin-field-full"><button className="admin-btn" type="submit"><i className={`fa-solid ${editingSlug ? 'fa-pen-to-square' : 'fa-plus'}`}></i>{editingSlug ? 'Save Changes' : 'Add Room'}</button></div>
          </form>

          <div className="admin-preview-card">
            <div className="image-box"><img src={previewCard.image} alt={previewCard.title} /><span className="tag">{previewCard.tag}</span><span className={`availability-tag ${String(previewCard.availability).toLowerCase()}`}>{previewCard.availability}</span></div>
            <div className="content">
              <h3>{previewCard.title}</h3>
              <p className="admin-room-number-preview">Room No: {previewCard.roomNumber}</p>
              <p>{previewCard.text}</p>
              <div className="bottom"><h4>{previewCard.price}</h4></div>
            </div>
          </div>

          {status.message ? <div className={`admin-alert ${status.type}`}>{status.message}</div> : null}
        </div>

        <div className="admin-panel">
          <div className="admin-header-row"><h3>Room Overview</h3></div>
          <div className="admin-room-list">
            {availableRooms.map((room) => (
              <div className="admin-room-item" key={room.slug}>
                <div className="admin-room-meta"><h4>{room.title}</h4><p>{room.price} · {room.tag}</p><p>{room.slug}</p><span className={`admin-availability-pill ${String(room.availability || 'Available').toLowerCase()}`}>{room.availability || 'Available'}</span></div>
                <div className="admin-room-actions">
                  <a className="admin-small-btn edit" href={`/room/${room.slug}`} target="_blank" rel="noreferrer">Preview</a>
                  <button className="admin-small-btn update" onClick={() => handleEdit(room.slug)}>Edit</button>
                  <button className="admin-small-btn delete" onClick={() => handleDelete(room.slug)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
