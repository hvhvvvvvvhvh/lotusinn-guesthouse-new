import { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { filePaths, readJson } from '../../lib/dataStore';

export async function getServerSideProps() {
  const roomsData = await readJson(filePaths.rooms);
  return { props: { initialData: roomsData } };
}

const sectionMap = {
  essential: 'Essential In-Room Amenities',
  premium: 'Premium Amenities',
  mealPlans: 'Meal Plans & Dining',
  services: 'Property Services'
};

const emptyItem = { section: 'essential', title: '', text: '', price: '' };

export default function AmenitiesAdmin({ initialData }) {
  const [roomsData, setRoomsData] = useState(initialData);
  const [itemForm, setItemForm] = useState(emptyItem);
  const [editingKey, setEditingKey] = useState('');
  const [status, setStatus] = useState({ type:'', message:'' });

  const amenitiesPage = roomsData?.amenitiesPage || {};

  const saveAll = async (nextData) => {
    const res = await fetch('/api/admin/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nextData)
    });
    if (!res.ok) throw new Error('Save failed');
  };

  const handleItemChange = (e) => setItemForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const updateHeaderField = (path, value) => {
    const nextData = structuredClone(roomsData);
    const keys = path.split('.');
    let ref = nextData;
    for (let i = 0; i < keys.length - 1; i += 1) ref = ref[keys[i]];
    ref[keys[keys.length - 1]] = value;
    setRoomsData(nextData);
  };

  const handleHeaderSave = async () => {
    try {
      await saveAll(roomsData);
      setStatus({ type:'success', message:'Amenities page content updated successfully.' });
    } catch (error) {
      console.error(error);
      setStatus({ type:'error', message:'Amenities page content could not be saved.' });
    }
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    if (!itemForm.title || !itemForm.text) {
      setStatus({ type:'error', message:'Title and description are required for amenities.' });
      return;
    }
    try {
      const nextData = structuredClone(roomsData);
      const section = itemForm.section;
      const list = nextData.amenitiesPage?.[section] || [];
      const nextList = editingKey
        ? list.map((item, index) => (String(index) === editingKey ? { title:itemForm.title, text:itemForm.text, price:itemForm.price } : item))
        : [{ title:itemForm.title, text:itemForm.text, price:itemForm.price }, ...list];
      nextData.amenitiesPage[section] = nextList;
      await saveAll(nextData);
      setRoomsData(nextData);
      setItemForm(emptyItem);
      setEditingKey('');
      setStatus({ type:'success', message: editingKey ? 'Amenity updated successfully.' : 'Amenity added successfully.' });
    } catch (error) {
      console.error(error);
      setStatus({ type:'error', message:'Amenity could not be saved.' });
    }
  };

  const handleEdit = (section, index) => {
    const item = (roomsData?.amenitiesPage?.[section] || [])[index];
    if (!item) return;
    setItemForm({ section, title:item.title || '', text:item.text || '', price:item.price || '' });
    setEditingKey(String(index));
  };

  const handleDelete = async (section, index) => {
    try {
      const nextData = structuredClone(roomsData);
      nextData.amenitiesPage[section] = (nextData.amenitiesPage?.[section] || []).filter((_, idx) => idx !== index);
      await saveAll(nextData);
      setRoomsData(nextData);
      setStatus({ type:'success', message:'Amenity removed successfully.' });
    } catch (error) {
      console.error(error);
      setStatus({ type:'error', message:'Amenity could not be removed.' });
    }
  };

  return (
    <AdminLayout title="Manage room amenities, meal plans and guest services shown on the public website.">
      <div className="admin-grid">
        <div className="admin-panel">
          <div className="admin-header-row"><h3>Amenities Page Content</h3><button className="admin-btn" type="button" onClick={handleHeaderSave}>Save Content</button></div>
          <div className="admin-form-grid">
            <div className="admin-field admin-field-full"><label>Hero Title</label><input value={amenitiesPage?.hero?.title || ''} onChange={(e)=>updateHeaderField('amenitiesPage.hero.title', e.target.value)} /></div>
            <div className="admin-field admin-field-full"><label>Hero Subtitle</label><textarea value={amenitiesPage?.hero?.subtitle || ''} onChange={(e)=>updateHeaderField('amenitiesPage.hero.subtitle', e.target.value)} /></div>
            <div className="admin-field"><label>Intro Label</label><input value={amenitiesPage?.intro?.label || ''} onChange={(e)=>updateHeaderField('amenitiesPage.intro.label', e.target.value)} /></div>
            <div className="admin-field"><label>Intro Title</label><input value={amenitiesPage?.intro?.title || ''} onChange={(e)=>updateHeaderField('amenitiesPage.intro.title', e.target.value)} /></div>
            <div className="admin-field admin-field-full"><label>Intro Text</label><textarea value={amenitiesPage?.intro?.text || ''} onChange={(e)=>updateHeaderField('amenitiesPage.intro.text', e.target.value)} /></div>
          </div>

          <div className="admin-header-row" style={{marginTop:'22px'}}><h3>{editingKey ? 'Edit Amenity Item' : 'Add Amenity Item'}</h3></div>
          <form className="admin-form-grid" onSubmit={handleItemSubmit}>
            <div className="admin-field"><label>Section</label><select name="section" value={itemForm.section} onChange={handleItemChange}>{Object.entries(sectionMap).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></div>
            <div className="admin-field"><label>Price / Status</label><input name="price" value={itemForm.price} onChange={handleItemChange} placeholder="Included / PKR 850 / Available" /></div>
            <div className="admin-field admin-field-full"><label>Title</label><input name="title" value={itemForm.title} onChange={handleItemChange} placeholder="Breakfast" /></div>
            <div className="admin-field admin-field-full"><label>Description</label><textarea name="text" value={itemForm.text} onChange={handleItemChange} placeholder="Describe the amenity or service" /></div>
            <div className="admin-field admin-field-full"><button className="admin-btn" type="submit">{editingKey ? 'Save Amenity' : 'Add Amenity'}</button></div>
          </form>
          {status.message ? <div className={`admin-alert ${status.type}`}>{status.message}</div> : null}
        </div>

        <div className="admin-panel">
          <div className="admin-header-row"><h3>Amenities Overview</h3></div>
          <div className="admin-room-list">
            {Object.entries(sectionMap).map(([sectionKey, label]) => (
              <div key={sectionKey} className="admin-amenity-group">
                <h4>{label}</h4>
                {((amenitiesPage?.[sectionKey]) || []).map((item, index) => (
                  <div className="admin-room-item" key={`${sectionKey}-${index}`}>
                    <div className="admin-room-meta"><h4>{item.title}</h4><p>{item.text}</p><p>{item.price}</p></div>
                    <div className="admin-room-actions">
                      <button className="admin-small-btn update" onClick={() => handleEdit(sectionKey, index)}>Edit</button>
                      <button className="admin-small-btn delete" onClick={() => handleDelete(sectionKey, index)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
