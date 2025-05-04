import React, { useState } from 'react';

const Uploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };

      // Intentar previsualizar solo si es imagen o PDF
      if (
        selectedFile.type.startsWith('image/') ||
        selectedFile.type === 'application/pdf'
      ) {
        reader.readAsDataURL(selectedFile);
      } else {
        setPreviewUrl(null); // No se puede previsualizar
      }
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Subir y visualizar archivo</h2>
      <input type="file" onChange={handleFileChange} className="mb-4" />

      {file && (
        <div className="mt-4">
          <p className="font-medium">Archivo seleccionado: {file.name}</p>

          {previewUrl ? (
            file.type.startsWith('image/') ? (
              <img src={previewUrl} alt="preview" className="mt-2 max-h-64 rounded shadow" />
            ) : file.type === 'application/pdf' ? (
              <iframe
                src={previewUrl}
                className="w-full h-64 mt-2 border"
                title="Vista previa del PDF"
              />
            ) : null
          ) : (
            <p className="text-sm text-gray-500 mt-2">
              Este tipo de archivo no tiene vista previa, pero ya ha sido cargado.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Uploader;