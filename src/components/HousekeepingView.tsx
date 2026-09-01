import React, { useState } from 'react';
import { Sparkles, Plus, CheckCircle, ShieldCheck, UserCheck } from 'lucide-react';
import type { HousekeepingTask, HousekeepingStatus, HousekeepingPriority, Room } from '../types/pms';

interface HousekeepingViewProps {
  tasks: HousekeepingTask[];
  rooms: Room[];
  onUpdateTaskStatus: (taskId: string, newStatus: HousekeepingStatus) => void;
  onAddTask: (newTask: HousekeepingTask) => void;
}

export const HousekeepingView: React.FC<HousekeepingViewProps> = ({
  tasks,
  rooms,
  onUpdateTaskStatus,
  onAddTask,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoomNumber, setSelectedRoomNumber] = useState(rooms[0]?.roomNumber || 'S1');
  const [assignedTo, setAssignedTo] = useState('สมใจ (แม่บ้าน)');
  const [priority, setPriority] = useState<HousekeepingPriority>('high');
  const [notes, setNotes] = useState('');

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const r = rooms.find(rm => rm.roomNumber === selectedRoomNumber);
    const newTask: HousekeepingTask = {
      id: 'hk-' + Date.now(),
      roomNumber: selectedRoomNumber,
      roomType: r ? r.type : 'บ้านพักหลังใหญ่',
      assignedTo,
      status: 'in_progress',
      priority,
      notes: notes || 'ทำความสะอาดทั่วไปและจัดเตรียมของใช้ในห้อง',
      updatedAt: new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };

    onAddTask(newTask);
    setIsModalOpen(false);
    setNotes('');
  };

  const getPriorityBadge = (p: HousekeepingPriority) => {
    switch (p) {
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">ด่วนมาก (High)</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">ปานกลาง</span>;
      case 'low':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">ปกติ</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">รายการงานแม่บ้าน & ซ่อมบำรุง</h3>
            <p className="text-xs text-slate-500">ติดตามสถานะความสะอาดเพื่อพร้อมส่งมอบห้องพักให้ลูกค้า</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-emerald-600/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>สั่งงานแม่บ้าน / แจ้งซ่อม</span>
        </button>
      </div>

      {/* Task List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-slate-900">{task.roomNumber}</span>
                  <span className="text-xs font-semibold text-slate-500">({task.roomType})</span>
                </div>
                {getPriorityBadge(task.priority)}
              </div>

              <div className="space-y-2 text-xs text-slate-600 mb-4">
                <p className="flex items-center gap-1.5 font-medium text-slate-800">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  ผู้รับผิดชอบ: <span className="font-bold text-slate-900">{task.assignedTo}</span>
                </p>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700">
                  <p className="font-semibold text-slate-800 mb-0.5">รายละเอียดงาน:</p>
                  <p className="leading-relaxed">{task.notes}</p>
                </div>
                <p className="text-[11px] text-slate-400">อัปเดตล่าสุด: {task.updatedAt}</p>
              </div>
            </div>

            {/* Action State Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-500">
                สถานะ: {task.status === 'in_progress' ? '🟡 กำลังทำ' : (task.status === 'dirty' ? '🔴 รอทำ' : (task.status === 'cleaned' ? '🔵 เสร็จแล้ว' : '🟢 ตรวจผ่านแล้ว'))}
              </span>

              <div className="flex items-center gap-1.5">
                {task.status !== 'cleaned' && task.status !== 'inspected' && (
                  <button
                    onClick={() => onUpdateTaskStatus(task.id, 'cleaned')}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors"
                  >
                    ทำเสร็จแล้ว
                  </button>
                )}
                {task.status === 'cleaned' && (
                  <button
                    onClick={() => onUpdateTaskStatus(task.id, 'inspected')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    ตรวจผ่าน & เปิดห้อง
                  </button>
                )}
                {task.status === 'inspected' && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> ตรวจเรียบร้อย
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Task */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">สั่งงานแม่บ้าน / แจ้งซ่อมห้องพัก</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateTask} className="p-6 space-y-4 text-sm text-slate-700">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">เลือกหมายเลขห้องพัก *</label>
                <select
                  value={selectedRoomNumber}
                  onChange={(e) => setSelectedRoomNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.roomNumber}>[{r.roomNumber}] {r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ผู้รับผิดชอบงาน *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สมใจ (แม่บ้าน), วิชัย (ช่าง)"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ระดับความเร่งด่วน</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as HousekeepingPriority)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="high">🔴 ด่วนมาก (มีแขกรอเช็คอิน)</option>
                  <option value="medium">🟡 ปานกลาง (ประจำวัน)</option>
                  <option value="low">🟢 ทั่วไป</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">รายละเอียดงานที่ต้องทำ</label>
                <textarea
                  rows={3}
                  placeholder="เช่น เปลี่ยนเครื่องนอน เติมสบู่ เช็คแอร์"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  บันทึกสั่งงาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
