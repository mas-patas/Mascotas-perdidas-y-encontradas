import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { XCircleIcon } from '@/shared/components/icons';
import { uploadImage } from '@/utils/imageUtils';
import { departments, getProvinces, getDistricts } from '@/data/locations';

// Schema de validación con Zod
const campaignReportSchema = z.object({
  address: z.string().min(1, 'La dirección de la campaña es obligatoria.').trim(),
  socialLink: z
    .string()
    .min(1, 'El link de Facebook o Instagram es obligatorio.')
    .refine(
      (link) => {
        const facebookPattern = /^(https?:\/\/)?(www\.)?(facebook\.com|fb\.com)\/.+/i;
        const instagramPattern = /^(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/.+/i;
        return facebookPattern.test(link) || instagramPattern.test(link);
      },
      {
        message: 'Por favor, ingresa un link válido de Facebook o Instagram.',
      }
    ),
  department: z.string().min(1, 'Por favor, selecciona un departamento.'),
  province: z.string().min(1, 'Por favor, selecciona una provincia.'),
  district: z.string().min(1, 'Por favor, selecciona un distrito.'),
  imageUrl: z.string().nullable().optional(),
});

type CampaignReportFormData = z.infer<typeof campaignReportSchema>;

interface CampaignReportFormProps {
  onSubmit: (data: CampaignReportFormData & { imageUrl: string | null }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const CampaignReportForm: React.FC<CampaignReportFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<CampaignReportFormData>({
    resolver: zodResolver(campaignReportSchema),
    defaultValues: {
      address: '',
      socialLink: '',
      department: '',
      province: '',
      district: '',
      imageUrl: null,
    },
  });

  const selectedDepartment = watch('department');
  const selectedProvince = watch('province');

  const provinces = selectedDepartment ? getProvinces(selectedDepartment) : [];
  const districts = selectedDepartment && selectedProvince ? getDistricts(selectedDepartment, selectedProvince) : [];

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!supportedTypes.includes(file.type)) {
      setUploadError('Formato de archivo no soportado. Por favor, usa JPEG, PNG, o WEBP.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const publicUrl = await uploadImage(file);
      setImagePreview(publicUrl);
      setValue('imageUrl', publicUrl);
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setUploadError('Error al subir la imagen. Intenta de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setValue('imageUrl', null);
  };

  const onFormSubmit = async (data: CampaignReportFormData) => {
    try {
      await onSubmit({
        ...data,
        imageUrl: imagePreview,
      });
      // Reset form after successful submission
      reset();
      setImagePreview(null);
    } catch (error) {
      // Error handling is done in parent component
      console.error('Error in form submission:', error);
    }
  };

  const inputClass =
    'w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition bg-white text-gray-900';

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="flex-grow overflow-y-auto">
      <div className="p-6 space-y-4">
        {(uploadError || Object.keys(errors).length > 0) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
            {uploadError || Object.values(errors)[0]?.message}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Nota importante:</strong> La administración revisará la veracidad de la campaña y la publicará en
            la sección &quot;Campañas&quot; en la brevedad posible.
          </p>
          <p className="text-sm text-red-600 font-semibold mt-2">
            ⚠️ Enviar información falsa puede resultar en la suspensión de tu cuenta.
          </p>
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-900 mb-1">
            Dirección de la Campaña <span className="text-red-500">*</span>
          </label>
          <input
            id="address"
            type="text"
            {...register('address')}
            className={`${inputClass} ${errors.address ? 'border-red-500' : ''}`}
            placeholder="Ej: Parque Central, Av. Principal 123"
          />
          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
        </div>

        <div>
          <label htmlFor="socialLink" className="block text-sm font-medium text-gray-900 mb-1">
            Link de Facebook o Instagram <span className="text-red-500">*</span>
          </label>
          <input
            id="socialLink"
            type="url"
            {...register('socialLink')}
            className={`${inputClass} ${errors.socialLink ? 'border-red-500' : ''}`}
            placeholder="https://www.facebook.com/... o https://www.instagram.com/..."
          />
          {errors.socialLink && <p className="text-red-500 text-xs mt-1">{errors.socialLink.message}</p>}
          <p className="text-xs text-gray-500 mt-1">
            Ingresa el link completo de la publicación o perfil de la campaña
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-900 mb-1">
              Departamento <span className="text-red-500">*</span>
            </label>
            <select
              id="department"
              {...register('department')}
              onChange={(e) => {
                setValue('department', e.target.value);
                setValue('province', '');
                setValue('district', '');
              }}
              className={`${inputClass} ${errors.department ? 'border-red-500' : ''}`}
            >
              <option value="">Selecciona...</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>}
          </div>
          <div>
            <label htmlFor="province" className="block text-sm font-medium text-gray-900 mb-1">
              Provincia <span className="text-red-500">*</span>
            </label>
            <select
              id="province"
              {...register('province')}
              onChange={(e) => {
                setValue('province', e.target.value);
                setValue('district', '');
              }}
              className={`${inputClass} ${errors.province ? 'border-red-500' : ''}`}
              disabled={!selectedDepartment}
            >
              <option value="">Selecciona...</option>
              {provinces.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
            {errors.province && <p className="text-red-500 text-xs mt-1">{errors.province.message}</p>}
          </div>
          <div>
            <label htmlFor="district" className="block text-sm font-medium text-gray-900 mb-1">
              Distrito <span className="text-red-500">*</span>
            </label>
            <select
              id="district"
              {...register('district')}
              className={`${inputClass} ${errors.district ? 'border-red-500' : ''}`}
              disabled={!selectedProvince}
            >
              <option value="">Selecciona...</option>
              {districts.map((dist) => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </select>
            {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Imagen de la Campaña (Opcional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-light file:text-brand-primary hover:file:bg-blue-100"
            disabled={isUploading}
          />
          {isUploading && <p className="text-sm text-blue-600 mt-1">Subiendo imagen...</p>}
          {imagePreview && (
            <div className="mt-2 relative inline-block">
              <img src={imagePreview} alt="Vista previa" className="h-32 w-32 object-cover rounded-md" />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-700"
              >
                <XCircleIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="p-4 bg-gray-50 border-t flex justify-end gap-3 rounded-b-lg">
        <button
          type="button"
          onClick={onCancel}
          className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="py-2 px-4 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Información'}
        </button>
      </div>
    </form>
  );
};

