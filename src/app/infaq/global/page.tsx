"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, X, Loader2, Edit, Trash2, FileText, Wallet, Home, ArrowLeft } from "lucide-react";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";

type Transaction = { 
  id: string; 
  date: string; 
  type: 'masuk' | 'keluar'; 
  amount: number; 
  description: string | null;
  source: 'manual' | 'otomatis'; 
};

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
const getTodayString = () => new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().split("T")[0];

export default function GlobalInfaqPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [totalBalance, setTotalBalance] = useState(0);
    const [openingBalance, setOpeningBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState<Partial<Transaction>>({ date: getTodayString(), type: 'masuk', amount: 0, description: ''});
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/infaq/ledger?month=${selectedMonth}&year=${selectedYear}`);
            if (!res.ok) throw new Error("Gagal memuat data");

            const { openingBalance, transactions, totalBalance } = await res.json();
            
            setOpeningBalance(openingBalance || 0);
            setTransactions(transactions || []);
            setTotalBalance(totalBalance || 0);
        } catch (error) {
            console.error(error);
            alert("Gagal memuat data pembukuan.");
        } finally {
            setLoading(false);
        }
    }, [selectedMonth, selectedYear]);

    useEffect(() => { fetchData(); }, [fetchData]);
    
    const openModalForAdd = () => {
        setIsEditMode(false);
        setFormData({ date: getTodayString(), type: 'masuk', amount: 0, description: ''});
        setIsModalOpen(true);
    };

    const openModalForEdit = (transaction: Transaction) => {
        setIsEditMode(true);
        setFormData(transaction);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const url = isEditMode ? `/api/infaq/ledger/${formData.id}` : '/api/infaq/ledger';
        const method = isEditMode ? 'PUT' : 'POST';
        
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Gagal menyimpan transaksi.");
            }
            setIsModalOpen(false);
            await fetchData();
        } catch (error) {
            alert(error instanceof Error ? error.message : "Terjadi kesalahan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Yakin ingin menghapus transaksi ini?")) return;
        try {
            const res = await fetch(`/api/infaq/ledger/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Gagal menghapus transaksi.");
            }
            await fetchData();
        } catch (error) {
            alert(error instanceof Error ? error.message : "Terjadi kesalahan.");
        }
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const monthName = monthNames[selectedMonth];
        const year = selectedYear;

        doc.setFontSize(16);
        doc.text("Laporan Pembukuan Infaq Global", 14, 20);
        doc.setFontSize(12);
        doc.text(`Periode: ${monthName} ${year}`, 14, 28);

        const head = [['Tanggal', 'Laporan', 'Catatan', 'Masuk (Rp)', 'Keluar (Rp)', 'Saldo (Rp)']];
        
        let currentBalance = openingBalance;
        const body = transactions.map(t => {
            const income = t.type === 'masuk' ? t.amount : 0;
            const outcome = t.type === 'keluar' ? t.amount : 0;
            currentBalance += (income - outcome);
            
            return [
                new Date(t.date + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
                t.type === 'masuk' ? 'Infaq Masuk' : 'Infaq Keluar',
                t.description || '-',
                income > 0 ? new Intl.NumberFormat('id-ID').format(income) : '-',
                outcome > 0 ? new Intl.NumberFormat('id-ID').format(outcome) : '-',
                new Intl.NumberFormat('id-ID').format(currentBalance)
            ];
        });

        const openingBalanceRow: RowInput = [
            { content: 'Saldo Awal Bulan', colSpan: 5, styles: { fontStyle: 'bold', halign: 'right' } },
            { content: new Intl.NumberFormat('id-ID').format(openingBalance), styles: { fontStyle: 'bold', halign: 'right' } }
        ];

        const finalBalance = openingBalance + transactions.reduce((acc, t) => acc + (t.type === 'masuk' ? t.amount : -t.amount), 0);
        const closingBalanceRow: RowInput = [
            { content: 'Saldo Akhir Bulan', colSpan: 5, styles: { fontStyle: 'bold', halign: 'right' } },
            { content: new Intl.NumberFormat('id-ID').format(finalBalance), styles: { fontStyle: 'bold', halign: 'right' } }
        ];

        autoTable(doc, {
            startY: 35,
            head: head,
            body: [openingBalanceRow, ...body, closingBalanceRow],
            theme: 'grid',
            headStyles: { fillColor: [38, 166, 154], halign: 'center' },
            columnStyles: {
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'right' },
            },
            didDrawPage: (data) => {
                const pageCount = doc.getNumberOfPages();
                doc.setFontSize(10);
                // PERUBAHAN DI SINI: Gunakan data.pageNumber
                doc.text(`Halaman ${data.pageNumber} dari ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });

        doc.save(`Laporan_Infaq_${monthName}_${year}.pdf`);
    };

    let runningBalance = openingBalance;

    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
            <div className="bg-white p-6 rounded-xl shadow-md max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Kelola Infaq Global</h1>
                        <p className="text-sm text-gray-500 mt-1">Laporan pembukuan kas infaq masuk dan keluar.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard-infaq" className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm">
                            <ArrowLeft size={18} /><span>Back</span>
                        </Link>
                        <Link href="/" className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
                            <Home size={18} /><span>Home</span>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-teal-600 text-white p-4 rounded-lg shadow flex items-center gap-4">
                        <Wallet size={32} className="text-teal-200 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-teal-100">Saldo Infaq Saat Ini</h3>
                            <p className="text-3xl font-bold">{loading ? <Loader2 className="animate-spin" /> : formatCurrency(totalBalance)}</p>
                        </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border flex flex-col justify-between gap-2">
                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                            <button onClick={openModalForAdd} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm">
                                <Plus size={18}/><span>Tambah Laporan Manual</span>
                            </button>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full items-center">
                            <div className="flex gap-2 w-full">
                                <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="w-full p-2 border rounded-md bg-white text-sm">
                                    {monthNames.map((name, index) => <option key={index} value={index}>{name}</option>)}
                                </select>
                                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-full p-2 border rounded-md bg-white text-sm">
                                    {Array.from({ length: 5 }, (_, i) => today.getFullYear() - i).map(year => <option key={year} value={year}>{year}</option>)}
                                </select>
                            </div>
                            <button onClick={handleExportPDF} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold text-sm">
                                <FileText size={16}/><span>PDF</span>
                            </button>
                        </div>
                    </div>
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
                        <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-xl">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-800">{isEditMode ? 'Edit Transaksi' : 'Tambah Laporan Infaq'}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full text-gray-400 hover:bg-gray-200"><X size={24}/></button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">Tanggal</label>
                                        <input type="date" id="date" value={formData.date || ''} onChange={(e) => setFormData({...formData, date: e.target.value})} className="mt-1 w-full p-2 border rounded-md" required />
                                    </div>
                                    <div>
                                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">Jenis Laporan</label>
                                        <select id="type" value={formData.type || 'masuk'} onChange={(e) => setFormData({...formData, type: e.target.value as 'masuk' | 'keluar'})} className="mt-1 w-full p-2 border rounded-md bg-white" required>
                                            <option value="masuk">Infaq Masuk</option>
                                            <option value="keluar">Infaq Keluar</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Jumlah (Rp)</label>
                                    <input type="number" id="amount" placeholder="0" min="0" value={formData.amount || ''} onChange={(e) => setFormData({...formData, amount: parseInt(e.target.value) || 0})} className="mt-1 w-full p-2 border rounded-md" required />
                                </div>
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Catatan</label>
                                    <textarea id="description" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} className="mt-1 w-full p-2 border rounded-md" rows={3} placeholder="Contoh: Beli spidol, Donasi dari Hamba Allah"></textarea>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300">Batal</button>
                                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2 disabled:bg-blue-400" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 size={16} className="animate-spin"/>}
                                        {isSubmitting ? 'Menyimpan...' : (isEditMode ? 'Update' : 'Simpan')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                
                {loading ? <p className="text-center py-10">Memuat data pembukuan...</p> : (
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 text-gray-700">
                                <tr>
                                    <th className="p-3 text-left font-semibold">Tanggal</th>
                                    <th className="p-3 text-left font-semibold">Laporan</th>
                                    <th className="p-3 text-right font-semibold">Jumlah</th>
                                    <th className="p-3 text-left font-semibold">Catatan</th>
                                    <th className="p-3 text-right font-semibold">Saldo</th>
                                    <th className="p-3 text-center font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="bg-gray-50 font-semibold">
                                    <td colSpan={4} className="p-2 text-right">Saldo Awal Bulan:</td>
                                    <td className="p-2 text-right font-mono">{formatCurrency(openingBalance)}</td>
                                    <td></td>
                                </tr>
                                {transactions.map(t => {
                                    runningBalance += (t.type === 'masuk' ? t.amount : -t.amount);
                                    const isAuto = t.source === 'otomatis';
                                    return (
                                    <tr key={t.id} className={`border-t hover:bg-gray-50 ${isAuto ? 'bg-indigo-50' : ''}`}>
                                        <td className="p-2 whitespace-nowrap">{new Date(t.date + 'T00:00:00').toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}</td>
                                        <td className={`p-2 font-semibold ${t.type === 'masuk' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'masuk' ? 'Infaq Masuk' : 'Infaq Keluar'}</td>
                                        <td className="p-2 text-right font-mono">{formatCurrency(t.amount)}</td>
                                        <td className="p-2 text-gray-600">{t.description || '-'}</td>
                                        <td className="p-2 text-right font-mono">{formatCurrency(runningBalance)}</td>
                                        <td className="p-2 text-center">
                                            {!isAuto && (
                                                <div className="flex justify-center items-center gap-2">
                                                    <button onClick={() => openModalForEdit(t)} className="p-1 text-yellow-600 hover:text-yellow-800" title="Edit">
                                                        <Edit size={16}/>
                                                    </button>
                                                    <button onClick={() => handleDelete(t.id)} className="p-1 text-red-600 hover:text-red-800" title="Hapus">
                                                        <Trash2 size={16}/>
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}