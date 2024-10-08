const Confirmation = ({
  title,
  description,
  isVisible,
  isLoading,
  closeModal,
  handleDeactivate,
  handleModalClick,
}: {
  title: string;
  description: string;
  isVisible: boolean;
  isLoading: boolean;
  closeModal: () => void;
  handleDeactivate: () => void;
  handleModalClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}) => {
  return (
    <div
      className={`fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50 
   ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      onClick={closeModal}
    >
      <div
        className={`bg-white p-6 rounded-md shadow-lg max-w-lg w-full transform transition-all duration-300
     ${isVisible ? 'scale-100' : 'scale-95'}`}
        onClick={handleModalClick}
      >
        <h3 className='text-lg font-semibold text-red-600 mb-4'>{title}</h3>
        <p className='text-gray-700 mb-6'>{description}</p>
        <div className='flex justify-end space-x-4'>
          <button
            onClick={closeModal}
            className='bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition duration-300 disabled:opacity-50 disabled:pointer-events-none'
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleDeactivate}
            className='bg-red-500 text-white py-2 px-4 rounded hover:bg-red-700 transition duration-300 disabled:opacity-50 disabled:pointer-events-none'
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;
