import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffAuth } from '../../context/StaffAuthContext';

const SimpleLogin: React.FC = () => {
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { staffLogin } = useStaffAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!employeeCode || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/staff/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employeeCode: employeeCode,
          password: password
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Đăng nhập thất bại');
      }

      const data = await response.json();
      
      const user = {
        id: data.user.id,
        employeeCode: data.user.username,
        full_name: 'Nhân viên ' + data.user.username,
        role: data.user.role,
        site: data.user.region
      };
      
      staffLogin(user, data.token);
      navigate('/staff/test');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Đăng nhập Nhân viên
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Hệ thống quản lý sân bay
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="employeeCode" className="sr-only">
                Mã nhân viên
              </label>
              <input
                id="employeeCode"
                name="employeeCode"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Mã nhân viên"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Đăng nhập
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Test với: <code className="bg-gray-100 px-2 py-1 rounded">NV001</code> / <code className="bg-gray-100 px-2 py-1 rounded">password</code>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimpleLogin;


