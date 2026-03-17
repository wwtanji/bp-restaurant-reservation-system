import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Portal from '../Portal';

interface PhotoGalleryModalProps {
  images: string[];
  restaurantName: string;
  isOpen: boolean;
  onClose: () => void;
}

const PhotoGalleryModal: React.FC<PhotoGalleryModalProps> = ({
  images,
  restaurantName,
  isOpen,
  onClose,
}) => {
  if (images.length === 0) return null;

  return (
    <Portal>
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/50 transition-opacity duration-300 data-[closed]:opacity-0"
        />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel
            transition
            className="bg-white dark:bg-dark-paper rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl
                       transition-all duration-300 data-[closed]:opacity-0 data-[closed]:scale-95"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-ot-iron dark:border-dark-border flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-ot-charade dark:text-dark-text">
                  {images.length} Photos
                </h3>
                <p className="text-sm text-ot-pale-sky dark:text-dark-text-secondary">
                  Explore {restaurantName}'s photos.
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close gallery"
                className="text-ot-pale-sky dark:text-dark-text-secondary hover:text-ot-charade dark:hover:text-dark-text transition-colors p-1 -mr-1"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              <div className="grid grid-cols-2 gap-1.5">
                {images.map((src, i) => (
                  <div
                    key={i}
                    className={`overflow-hidden rounded-lg ${i === 0 ? 'col-span-2' : ''}`}
                  >
                    <img
                      src={src}
                      alt={`${restaurantName} ${i + 1}`}
                      className={`w-full object-cover hover:scale-[1.02] transition-transform duration-300 ${
                        i === 0 ? 'h-64 md:h-80' : 'h-48 md:h-56'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </Portal>
  );
};

export default PhotoGalleryModal;
