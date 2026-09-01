import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Users, Plus, Tag } from 'lucide-react';
import type { Room, RoomStatus, RoomType } from '../types/pms';

interface RoomsViewProps {
  rooms: Room[];
  searchTerm: string;
  onUpdateRoomStatus: (roomId: string, status: RoomStatus) => void;
  onAddRoom: (newRoom: Room) => void;
}

export const RoomsView: React.FC<RoomsViewProps> = ({
  rooms,
  searchTerm,
  onUpdateRoomStatus,
  onAddRoom,
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Room form state
  const [newNumber, setNewNumber] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<RoomType>('บ้านพักหลังใหญ่');
  const [newPrice, setNewPrice] = useState(1500);
  const [newCapacity, setNewCapacity] = useState(4);
  const [newAmenities, setNewAmenities] = useState('เครื่องปรับอากาศ, สมาร์ททีวี, เครื่องทำน้ำอุ่น, ตู้เย็น, ระเบียงชมวิว');

  const availableRoomTypes = Array.from(new Set(rooms.map(r => r.type).filter(Boolean)));

  const filteredRooms = rooms.filter((r) => {
    const matchesSearch = 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || r.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber || !newName) return;

    const created: Room = {
      id: 'room-' + Date.now(),
      roomNumber: newNumber,
      name: newName,
      type: newType,
      pricePerNight: Number(newPrice),
      capacity: Number(newCapacity),
      status: 'available',
      floor: 1,
      amenities: newAmenities.split(',').map(s => s.trim()).filter(Boolean),
      imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
    };

    onAddRoom(created);
    setIsAddModalOpen(false);
    setNewNumber('');
    setNewName('');
  };

  const getStatusBadge = (status: RoomStatus) => {
    switch (status) {
      case 'available':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">🟢 ห้องว่าง (Available)</span>;
      case 'occupied':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">🔵 มีผู้พัก (Occupied)</span>;
      case 'cleaning':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">🟡 ทำความสะอาด (Cleaning)</span>;
      case 'maintenance':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">🔴 ปิดซ่อมบำรุง</span>;
    }
  };

  return (
    <div className="space-y-6 font-['Prompt']">
      {/* Filter and Add Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Room Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 cursor-pointer"
          >
            <option value="all">ทุกประเภทบ้านพัก ({rooms.length} หลัง)</option>
            {availableRoomTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3.5 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
          >
            <option value="all">ทุกสถานะห้องพัก</option>
            <option value="available">🟢 เฉพาะห้องว่าง</option>
            <option value="occupied">🔵 เฉพาะมีผู้เข้าพัก</option>
            <option value="cleaning">🟡 เฉพาะกำลังทำความสะอาด</option>
            <option value="maintenance">🔴 เฉพาะปิดซ่อมบำรุง</option>
          </select>
        </div>

        {/* Add Room Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-emerald-600/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มห้องพัก / วิลล่าใหม่</span>
        </button>
      </div>

      {/* Rooms Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredRooms.map((room) => (
          <div
            key={room.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            {/* Room Image */}
            <div className="relative h-44 bg-slate-100 overflow-hidden">
              <img 
                src={room.imageUrl || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'} 
                alt={room.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1 rounded-xl text-xs font-black">
                {room.roomNumber}
              </div>
              <div className="absolute top-3 right-3">
                {getStatusBadge(room.status)}
              </div>
              <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm text-emerald-800 px-3 py-1 rounded-xl text-xs font-black shadow-sm">
                ฿{room.pricePerNight.toLocaleString()}<span className="text-[10px] font-normal text-slate-600">/คืน</span>
              </div>
            </div>

            {/* Room Body Details */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 mb-1">{room.name}</h3>
                <p className="text-xs text-emerald-700 font-semibold mb-3 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  {room.type} &bull; พักได้สูงสุด {room.capacity} ท่าน
                </p>

                {/* Amenities pills */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {room.amenities.slice(0, 4).map((a, idx) => (
                    <span key={idx} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                      {a}
                    </span>
                  ))}
                  {room.amenities.length > 4 && (
                    <span className="text-[11px] text-slate-400 font-medium">+{room.amenities.length - 4}</span>
                  )}
                </div>

                {/* Current guest info if occupied */}
                {room.status === 'occupied' && room.currentGuest && (
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200/60 text-xs text-blue-900 mb-3 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      ผู้พัก: {room.currentGuest.name}
                    </p>
                    <p className="text-[11px] text-blue-700">
                      เบอร์โทร: {room.currentGuest.phone}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      ออกวันที่: {room.currentGuest.checkOut}
                    </p>
                  </div>
                )}
              </div>

              {/* Status Switcher Bottom */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">เปลี่ยนสถานะ:</span>
                <select
                  value={room.status}
                  onChange={(e) => onUpdateRoomStatus(room.id, e.target.value as RoomStatus)}
                  className="text-xs font-bold bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer text-slate-800"
                >
                  <option value="available">🟢 ว่าง (Available)</option>
                  <option value="occupied">🔵 มีผู้พัก (Occupied)</option>
                  <option value="cleaning">🟡 ทำความสะอาด (Cleaning)</option>
                  <option value="maintenance">🔴 ปิดซ่อม (Maintenance)</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Room Modal */}
      {isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">เพิ่มบ้านพัก / วิลล่าใหม่</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-sm text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">หมายเลขห้อง/วิลล่า *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น V103"
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">ประเภทบ้านพัก *</label>
                  <select
                    value={newType}
                    onChange={(e) => {
                      const t = e.target.value as RoomType;
                      setNewType(t);
                      if (t === 'บ้านพักหลังใหญ่') { setNewPrice(1500); setNewCapacity(4); }
                      else if (t === 'บ้านพักหลังกลาง') { setNewPrice(1200); setNewCapacity(2); }
                      else if (t === 'บ้านพักแฝดหลังเล็ก') { setNewPrice(1000); setNewCapacity(2); }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium text-xs"
                  >
                    <option value="บ้านพักหลังใหญ่">บ้านพักหลังใหญ่ (1,500 บาท/คืน, 4 ท่าน)</option>
                    <option value="บ้านพักหลังกลาง">บ้านพักหลังกลาง (1,200 บาท/คืน, 2 ท่าน)</option>
                    <option value="บ้านพักแฝดหลังเล็ก">บ้านพักแฝดหลังเล็ก (1,000 บาท/คืน, 2 ท่าน)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ชื่อเรียกบ้านพัก *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สวอน วิลล่า S7"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">ราคาต่อคืน (บาท) *</label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">จำนวนผู้เข้าพัก (คน)</label>
                  <input
                    type="number"
                    required
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">สิ่งอำนวยความสะดวก (คั่นด้วยจุลภาค)</label>
                <input
                  type="text"
                  value={newAmenities}
                  onChange={(e) => setNewAmenities(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  บันทึกห้องพักใหม่
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
