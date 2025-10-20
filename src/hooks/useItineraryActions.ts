import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDeleteItinerary } from '@/hooks/useDeleteItinerary';

interface UseItineraryActionsProps {
  id: string;
}

export const useItineraryActions = ({ id }: UseItineraryActionsProps) => {
  const router = useRouter();
  const deleteItinerary = useDeleteItinerary();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleDelete = async () => {
    await deleteItinerary(id);
    router.push('/itineraries');
  };

  const handleEdit = () => {
    const params = new URLSearchParams(window.location.search);
    const day = params.get('day');
    if (day) {
      router.push(`/itineraries/${id}/edit?day=${day}`);
    } else {
      router.push(`/itineraries/${id}/edit`);
    }
  };

  const handleDeleteConfirm = () => {
    setIsConfirmOpen(true);
  };

  const handleBack = () => {
    router.push('/itineraries');
  };

  const handleLogin = () => {
    router.push(`/auth/login?returnTo=/itineraries/${id}`);
  };

  return {
    handleDelete,
    handleEdit,
    handleDeleteConfirm,
    handleBack,
    handleLogin,
    isConfirmOpen,
    setIsConfirmOpen,
  };
};
