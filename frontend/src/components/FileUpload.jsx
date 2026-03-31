import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import useStore from '../store';

const ACCEPTED = {
  'text/csv': ['.csv'],
  'application/json': ['.json'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
};

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload() {
  const [file, setFile] = useState(null);
  const { status, setUploading, setUploadResult, addStep, setCharts, setDone, setError, reset } = useStore();

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles: 1,
  });

  const handleAnalyze = async () => {
    if (!file) return;

    setUploading();

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.detail || 'Upload failed');
        return;
      }

      const data = await res.json();
      setUploadResult(data.task_id, data.filename, data.rows, data.columns);

      // Open SSE stream
      const source = new EventSource(`http://localhost:8000/stream/${data.task_id}`);

      source.onmessage = (e) => {
        const event = JSON.parse(e.data);
        if (event.type === 'step') {
          addStep(event.content);
        } else if (event.type === 'charts') {
          setCharts(event.content);
        } else if (event.type === 'done') {
          setDone();
          source.close();
        } else if (event.type === 'error') {
          setError(event.content);
          source.close();
        }
      };

      source.onerror = () => {
        setError('Lost connection to server.');
        source.close();
      };

    } catch (err) {
      setError(err.message);
    }
  };

  const isLoading = status === 'uploading' || status === 'streaming';

  return (
    <div className="card">
      <div className="card-title">Upload Data</div>

      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} id="file-input" />
        <div className="dropzone-icon">📂</div>
        <div className="dropzone-text">
          {isDragActive ? 'Drop it here!' : 'Drag & drop a file'}
        </div>
        <div className="dropzone-hint">CSV · JSON · XLSX · XLS</div>
      </div>

      {file && (
        <div className="dropzone-file-info">
          <span>📄</span>
          <span className="dropzone-file-name">{file.name}</span>
          <span className="dropzone-file-size">{formatBytes(file.size)}</span>
        </div>
      )}

      <button
        id="analyze-btn"
        className="btn btn-primary"
        onClick={handleAnalyze}
        disabled={!file || isLoading}
      >
        {isLoading ? '⏳ Analyzing...' : '✨ Analyze with AI'}
      </button>

      {status !== 'idle' && (
        <button id="reset-btn" className="btn btn-ghost" onClick={() => { reset(); setFile(null); }}>
          ↺ Start Over
        </button>
      )}
    </div>
  );
}
