import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, ArrowLeft} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Row {
    _id: string;
    Name: string;
    Amount: number;
    Date: string;
    Verified?: 'Yes' | 'No';
    createdAt: string;
}

interface Pagination {
    currentPage: number;
    totalPages: number;
    totalRows: number;
    rowsPerPage: number;
}

const DocumentDetailsPage = () => {
    const { documentId } = useParams<{ documentId: string }>();
    const [rows, setRows] = useState<Row[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteRowId, setDeleteRowId] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const navigate = useNavigate();

    const fetchRows = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(
                `https://excel-backend-3kle.onrender.com/documents/${documentId}/rows?page=${currentPage}&limit=10`
            );
            setRows(response.data.rows);
            setPagination(response.data.pagination);
        } catch (err) {
            setError('Failed to fetch document data. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRows();
    }, [documentId, currentPage]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).replace(/\//g, '-');
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount).replace('₹', '₹ ');
    };

    const handleDeleteClick = (rowId: string) => {
        setDeleteRowId(rowId);
        setShowDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteRowId) return;

        try {
            await axios.delete(`https://excel-backend-3kle.onrender.com/documents/${documentId}/rows/${deleteRowId}`);
            setShowDeleteDialog(false);
            setDeleteRowId(null);
            fetchRows();
        } catch (err) {
            setError('Failed to delete row. Please try again later.');
        }
    };

    return (
        <div className="min-h-screen bg-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <button
                        onClick={() => navigate('/documents')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Documents
                    </button>
                </div>

                {/* Title Section */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl mb-4">
                        Document Details
                    </h1>
                    {pagination && (
                        <p className="text-lg text-gray-400">
                            Showing {pagination.totalRows} rows
                        </p>
                    )}
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex justify-center items-center min-h-[400px]">
                        <Loader2 className="w-12 h-12 text-white animate-spin" />
                    </div>
                ) : error ? (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
                        <p className="text-red-200 text-center">{error}</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Table */}
                        <div className="overflow-x-auto rounded-xl border border-gray-800">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-800 bg-gray-900/50">
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Amount</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Date</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Verified</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {rows.map((row) => (
                                        <tr 
                                            key={row._id}
                                            className="hover:bg-gray-800/50 transition-colors"
                                        >
                                            <td className="px-6 py-4 text-sm text-gray-200">{row.Name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-200">
                                                {formatAmount(row.Amount)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-200">
                                                {formatDate(row.Date)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                    ${row.Verified === 'Yes' 
                                                        ? 'bg-green-500/10 text-green-400' 
                                                        : 'bg-yellow-500/10 text-yellow-400'
                                                    }`}>
                                                    {row.Verified || 'No'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleDeleteClick(row._id)}
                                                    className="rounded-lg bg-white px-8 py-3 text-sm font-light tracking-widest text-black transition-all hover:bg-gray-200 flex gap-2"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex justify-center gap-2 pt-4">
                                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors
                                            ${currentPage === page
                                                ? 'bg-white text-black'
                                                : 'text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Delete Dialog */}
            {showDeleteDialog && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4">
                    <div className="bg-black rounded-xl max-w-md w-full p-6 border border-gray-800">
                        <h3 className="text-xl font-semibold text-white mb-4">
                            Confirm Deletion
                        </h3>
                        <p className="text-gray-400 mb-8">
                            Are you sure you want to delete this row? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setShowDeleteDialog(false)}
                                className="rounded-lg border border-gray-700 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-gray-900"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="rounded-lg bg-white px-8 py-3 text-sm font-semibold text-black transition-all hover:bg-gray-200"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentDetailsPage;