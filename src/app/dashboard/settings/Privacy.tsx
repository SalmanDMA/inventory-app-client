const Privacy = () => {
  return (
    <div className='p-6 bg-gray-100 rounded-md shadow-lg'>
      <h2 className='text-xl font-bold mb-6 text-center'>Settings</h2>

      {/* Notification Privacy Card */}
      <div className='mb-6 p-6 bg-white rounded-md shadow-md'>
        <h3 className='text-lg font-semibold mb-4'>Notification</h3>
        <form>
          <div className='mb-4'>
            <label className='flex items-center cursor-pointer'>
              <input
                type='checkbox'
                className='mr-2 h-4 w-4 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500'
              />
              Email Notifications
            </label>
          </div>
          <div className='mb-4'>
            <label className='flex items-center cursor-pointer'>
              <input
                type='checkbox'
                className='mr-2 h-4 w-4 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500'
              />
              SMS Notifications
            </label>
          </div>
          <button className='w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-300'>
            Toggle Notification
          </button>
        </form>
      </div>

      {/* Privacy Settings Card */}
      <div className='p-6 bg-white rounded-md shadow-md'>
        <h3 className='text-lg font-semibold mb-4'>Settings</h3>
        <form>
          <div className='mb-4'>
            <label className='flex items-center cursor-pointer'>
              <input
                type='checkbox'
                className='mr-2 h-4 w-4 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500'
              />
              Make Profile Public
            </label>
          </div>
          <button className='w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-300'>
            Toggle Settings
          </button>
        </form>
      </div>
    </div>
  );
};

export default Privacy;
