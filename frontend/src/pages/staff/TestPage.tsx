import React from 'react';

const TestPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Test Page</h1>
      <p className="text-gray-600">Trang này đang hoạt động!</p>
      <div className="mt-4 p-4 bg-blue-100 rounded-lg">
        <p className="text-blue-800">✅ React component đã load thành công</p>
        <p className="text-blue-800">✅ Tailwind CSS đang hoạt động</p>
        <p className="text-blue-800">✅ Routing đang hoạt động</p>
      </div>
    </div>
  );
};

export default TestPage;
