import { useState, useEffect } from 'react';
import { FileText, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Document {
    _id: string;
    fileName: string;
    uploadDate: string;
    rowCount: number;
    createdAt: string;
}

const DocumentsListPage = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const response = await axios.get('https://excel-backend-3kle.onrender.com/documents');
                setDocuments(response.data.documents);
            } catch (err) {
                setError('Failed to fetch documents. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDocuments();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen p-8 flex flex-col justify-start items-center gap-8 w-full">
            <div className="max-w-4xl mx-auto flex-col flex justify-center items-center w-full">
            <div className="w-full flex justify-between items-center mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-gray-400 hover:text-gray-200 
                                 transition-colors duration-200"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </button>
                </div>
                <div className="text-center mb-12">
                    <h1 className="text-6xl text-gray-200 font-extrabold tracking-wide mb-8">
                        Uploaded Documents
                    </h1>
                    <p className="text-gray-400 text-xl">
                        Click on any document to view its contents
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center min-h-[200px]">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="p-4 bg-red-500/10 border border-red-200/20 rounded-lg w-full">
                        <p className="text-red-200 text-center">{error}</p>
                    </div>
                ) : documents.length === 0 ? (
                    <div className="text-center text-gray-400">
                        <p>No documents found. Start by uploading an Excel file.</p>
                    </div>
                ) : (
                    <div className="w-full space-y-4">
                        {documents.map((doc) => (
                            <div
                                key={doc._id}
                                onClick={() => navigate(`/documents/${doc._id}`)}
                                className="border border-gray-700 rounded-lg p-6 hover:bg-gray-800/50 
                                         transition-all duration-200 cursor-pointer w-full
                                         flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <FileText className="w-8 h-8 text-blue-400" />
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-200">
                                            {doc.fileName}
                                        </h3>
                                        <p className="text-sm text-gray-400">
                                            Uploaded on {formatDate(doc.uploadDate)}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-gray-200">{doc.rowCount} rows</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400 
                                                          group-hover:text-blue-400 
                                                          transition-colors duration-200" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentsListPage;