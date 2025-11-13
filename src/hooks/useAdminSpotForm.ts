import { useState, useCallback } from 'react';
import { CampingSpotWithId } from '@/data/schemas/campingSpot';

type UseAdminSpotFormReturn = {
  /**
   * Currently selected camping spot (null for new spot creation)
   */
  selectedSpot: CampingSpotWithId | null;
  /**
   * Whether the form dialog is currently visible
   */
  showForm: boolean;
  /**
   * Whether the current operation is creating a new spot (vs editing)
   */
  isNewSpot: boolean;
  /**
   * Open the form dialog for creating a new spot or editing an existing one
   * @param spot - Optional spot to edit. If not provided, opens form for new spot creation
   */
  openForm: (spot?: CampingSpotWithId) => void;
  /**
   * Close the form dialog and clear selected spot
   */
  closeForm: () => void;
  /**
   * Set the selected spot (typically used when clicking on map markers)
   * @param spot - The spot to select
   */
  handleSpotSelect: (spot: CampingSpotWithId) => void;
  /**
   * Clear the selected spot without closing the form
   */
  clearSelection: () => void;
};

/**
 * Custom hook to manage camping spot form state and operations
 *
 * Handles the state for creating new spots and editing existing ones,
 * including form visibility and selected spot tracking.
 *
 * @example
 * ```tsx
 * const {
 *   selectedSpot,
 *   showForm,
 *   isNewSpot,
 *   openForm,
 *   closeForm,
 *   handleSpotSelect
 * } = useAdminSpotForm();
 *
 * // Open form for new spot
 * <Button onClick={() => openForm()}>新規追加</Button>
 *
 * // Open form for editing
 * <Button onClick={() => openForm(spot)}>編集</Button>
 *
 * // Show form dialog
 * {showForm && (
 *   <SpotForm
 *     spot={selectedSpot}
 *     onClose={closeForm}
 *     isNew={isNewSpot}
 *   />
 * )}
 * ```
 */
export function useAdminSpotForm(): UseAdminSpotFormReturn {
  const [selectedSpot, setSelectedSpot] = useState<CampingSpotWithId | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);

  const openForm = useCallback((spot?: CampingSpotWithId) => {
    if (spot) {
      setSelectedSpot(spot);
    } else {
      setSelectedSpot(null);
    }
    setShowForm(true);
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setSelectedSpot(null);
  }, []);

  const handleSpotSelect = useCallback((spot: CampingSpotWithId) => {
    setSelectedSpot(spot);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSpot(null);
  }, []);

  const isNewSpot = !selectedSpot?._id;

  return {
    selectedSpot,
    showForm,
    isNewSpot,
    openForm,
    closeForm,
    handleSpotSelect,
    clearSelection,
  };
}
