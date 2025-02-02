import { useState, useRef, DragEvent, useCallback } from 'react';
import { Upload, CheckCircle, Loader2, FileText, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from "axios";

// Enhanced error types
interface UploadError {
    message: string;
    code?: string;
    errors?: Array<{
        sheetName: string;
        rowNumber: number;
        error: string;
    }>;
}

interface ValidationResult {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    errors?: Array<{
        sheetName: string;
        rowNumber: number;
        error: string;
    }>;
}

enum FileStatus {
    IDLE = 'idle',
    VALIDATING = 'validating',
    VALIDATED = 'validated',
    IMPORTING = 'importing',
    IMPORTED = 'imported',
    ERROR = 'error'
}

const FileImportPage = () => {
    const navigate = useNavigate();
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<UploadError | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<FileStatus>(FileStatus.IDLE);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [retryCount, setRetryCount] = useState(0);
    const MAX_RETRIES = 3;

    const handleError = useCallback((error: unknown): UploadError => {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<UploadError>;
            
            if (!axiosError.response) {
                return {
                    message: 'Unable to connect to the server. Please check your internet connection.',
                    code: 'NETWORK_ERROR'
                };
            }

            if (axiosError.response.status >= 500) {
                return {
                    message: 'Server error occurred. Please try again later.',
                    code: 'SERVER_ERROR'
                };
            }

            if (axiosError.response.data) {
                return axiosError.response.data;
            }

            return {
                message: 'An error occurred while processing your request.',
                code: 'CLIENT_ERROR'
            };
        }

        return {
            message: 'An unexpected error occurred.',
            code: 'UNKNOWN_ERROR'
        };
    }, []);

    const validateFile = useCallback((file: File): boolean => {
        const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        const maxSize = 2 * 1024 * 1024; // 2MB

        if (!validTypes.includes(file.type)) {
            setError({
                message: 'Invalid file format. Please upload only .xlsx files.',
                code: 'INVALID_FORMAT'
            });
            return false;
        }

        if (file.size > maxSize) {
            setError({
                message: 'File size exceeds limit. Please upload files smaller than 2MB.',
                code: 'FILE_TOO_LARGE'
            });
            return false;
        }

        if (file.size === 0) {
            setError({
                message: 'The file appears to be empty or corrupted.',
                code: 'EMPTY_FILE'
            });
            return false;
        }

        return true;
    }, []);

    const handleFile = useCallback(async (file: File) => {
        setError(null);
        setStatus(FileStatus.IDLE);
        setValidationResult(null);
        
        if (!validateFile(file)) {
            setStatus(FileStatus.ERROR);
            return;
        }

        setFile(file);
        setStatus(FileStatus.VALIDATING);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post("http://localhost:3000/validate", formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 30000 // 30 second timeout
            });
            setValidationResult(response.data);
            setStatus(FileStatus.VALIDATED);
        } catch (err) {
            const processedError = handleError(err);
            setError(processedError);
            setStatus(FileStatus.ERROR);
            setFile(null);
        }
    }, [validateFile, handleError]);

    const handleImport = useCallback(async () => {
        if (!file) return;
        setStatus(FileStatus.IMPORTING);

        const formData = new FormData();
        formData.append('file', file);

        try {
            await axios.post("http://localhost:3000/import", formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 60000, // 60 second timeout
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total ?? 1));
                    console.log(`Upload Progress: ${percentCompleted}%`);
                }
            });
            setStatus(FileStatus.IMPORTED);
        } catch (err) {
            const processedError = handleError(err);
            
            if (processedError.code === 'NETWORK_ERROR' && retryCount < MAX_RETRIES) {
                setRetryCount(prev => prev + 1);
                setTimeout(() => handleImport(), 1000 * (retryCount + 1)); // Exponential backoff
                return;
            }
            
            setError(processedError);
            setStatus(FileStatus.ERROR);
        }
    }, [file, retryCount, handleError]);

    const handleDrag = useCallback((e: DragEvent<HTMLDivElement>, isDragging: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(isDragging);
    }, []);

    const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFile(droppedFile);
        }
    }, [handleFile]);

    const renderError = useCallback(() => {
        if (!error) return null;

        return (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="text-red-200 font-medium">Error</h3>
                        <p className="mt-1 text-red-200/90">{error.message}</p>
                        {error.errors && error.errors.length > 0 && (
                            <ul className="mt-2 list-disc pl-4 text-red-200/80">
                                {error.errors.map((err, index) => (
                                    <li key={index} className="text-sm">
                                        Sheet "{err.sheetName}" Row {err.rowNumber}: {err.error}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {retryCount > 0 && (
                            <p className="mt-2 text-sm text-red-200/70">
                                Retry attempt {retryCount} of {MAX_RETRIES}...
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }, [error, retryCount]);

    const isProcessing = status === FileStatus.VALIDATING || status === FileStatus.IMPORTING;
    const isSuccess = status === FileStatus.IMPORTED;

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center bg-black px-4">
            {/* Gradient background effect */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 blur-3xl">
                    <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-blue-500/20 to-purple-500/20 opacity-20" />
                </div>
            </div>

            <div className="relative w-full max-w-4xl mx-auto">
                {/* Header section */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl mb-6">
                        Drag Or Upload
                    </h1>
                    <p className="text-lg text-gray-400">
                        Only <span className="text-white font-semibold">.xlsx</span> files up to 2MB are accepted
                    </p>
                </div>

                {/* Upload area */}
                <div
                    onDragOver={(e) => handleDrag(e, true)}
                    onDragLeave={(e) => handleDrag(e, false)}
                    onDrop={handleDrop}
                    className={`
                        relative border-2 border-dashed rounded-2xl p-12
                        flex flex-col items-center justify-center
                        transition-all duration-300 w-full
                        min-h-[320px] space-y-6 backdrop-blur-sm
                        ${isDragging ? 'border-blue-400 bg-blue-500/5' : 'border-gray-700 hover:border-gray-600'}
                        ${error ? 'border-red-500/50 bg-red-500/5' : ''}
                        ${isSuccess ? 'border-green-500/50 bg-green-500/5' : ''}
                    `}
                >
                    {isProcessing ? (
                        <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
                    ) : isSuccess ? (
                        <CheckCircle className="w-12 h-12 text-green-400" />
                    ) : (
                        <Upload className={`w-12 h-12 ${isDragging ? 'text-blue-400' : 'text-gray-400'}`} />
                    )}
                    
                    <div className="text-center space-y-2">
                        <p className="text-lg text-gray-300">
                            {isDragging ? 'Drop your file here' : 'Drag & drop your Excel file here'}
                        </p>
                        <p className="text-sm text-gray-500">or</p>
                    </div>
                    
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                        accept=".xlsx"
                        className="hidden"
                    />
                    
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="rounded-lg bg-white px-8 py-3 text-sm font-semibold text-black 
                                 transition-all hover:bg-gray-200 disabled:opacity-50 
                                 disabled:cursor-not-allowed"
                    >
                        Select File
                    </button>
                </div>

                {renderError()}

                {validationResult && !error && (
                    <div className="mt-4 p-6 bg-black/40 border border-gray-800 rounded-xl backdrop-blur-sm">
                        <div className="space-y-4">
                            {/* File Information */}
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-white/70 flex-shrink-0" />
                                <p className="text-white">
                                    File validation complete: {file?.name}
                                </p>
                            </div>

                            {/* Statistics Grid */}
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div className="text-gray-400">Total Rows: {validationResult.totalRows}</div>
                                <div className="text-emerald-400">Valid Rows: {validationResult.validRows}</div>
                                <div className="text-red-400">Invalid Rows: {validationResult.invalidRows}</div>
                            </div>

                            {/* Error Messages */}
                            {validationResult.errors && validationResult.errors.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-gray-200 text-sm">The following rows will be skipped during import:</p>
                                    <ul className="mt-2 space-y-1">
                                        {validationResult.errors.map((err, index) => (
                                            <li key={index} className="text-gray-400 text-sm">
                                                Row {err.rowNumber}: {err.error}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Import Button */}
                            <button
                                onClick={handleImport}
                                disabled={isProcessing || validationResult.validRows === 0}
                                className="flex items-center gap-2 bg-white text-black px-5 py-2 rounded-lg
                                         hover:bg-gray-100 transition-all disabled:opacity-50 
                                         disabled:cursor-not-allowed justify-center w-full"
                            >
                                {status === FileStatus.IMPORTING ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    `Import ${validationResult.validRows} Valid Rows`
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Success message */}
                {isSuccess && (
                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                            <p className="text-green-200">
                                Successfully imported {validationResult?.validRows} rows
                            </p>
                        </div>
                        <div className="mt-4 flex justify-center">
                            <button
                                onClick={() => navigate('/documents')}
                                className="rounded-lg bg-white px-8 py-3 text-sm font-semibold text-black 
                                         transition-all hover:bg-gray-200"
                            >
                                View Documents
                            </button>
                        </div>
                    </div>
                )}
            </div>
            </div>
    )}

    export default FileImportPage