import React, { useState, useEffect } from 'react';

interface Staff {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  role: 'admin' | 'manager' | 'staff';
  status: 'active' | 'inactive';
  hireDate: string;
  lastLogin: string;
  permissions: string[];
}

const StaffAdmin: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    department: '',
    role: '',
    status: '',
    search: ''
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  const [newStaff, setNewStaff] = useState({
    employeeCode: '',
    fullName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    role: 'staff' as 'admin' | 'manager' | 'staff',
    password: '',
    permissions: [] as string[]
  });

  const availablePermissions = [
    'flights.read', 'flights.write', 'flights.delete',
    'bookings.read', 'bookings.write', 'bookings.cancel',
    'users.read', 'users.write', 'users.delete',
    'reports.read', 'reports.export',
    'system.settings', 'system.maintenance'
  ];

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/staff', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Không thể tải dữ liệu nhân viên');
      }

      const data = await response.json();
      
      // Transform API data to match our interface
      const transformedStaff: Staff[] = data.map((staff: any) => ({
        id: staff.id,
        employeeCode: staff.employee_code,
        fullName: staff.full_name,
        email: staff.email,
        phone: staff.phone || 'N/A',
        department: staff.department || 'N/A',
        position: staff.position || 'N/A',
        role: staff.role,
        status: staff.is_active ? 'active' : 'inactive',
        hireDate: staff.created_at || new Date().toISOString().split('T')[0],
        lastLogin: staff.last_login || 'Chưa đăng nhập',
        permissions: staff.permissions || []
      }));
      
      setStaff(transformedStaff);
    } catch (error) {
      console.error('Error fetching staff:', error);
      // Fallback to mock data if API fails
      const mockStaff: Staff[] = [
        {
          id: '1',
          employeeCode: 'NV001',
          fullName: 'Nguyễn Văn A',
          email: 'nguyenvana@baynhanh.vn',
          phone: '0123456789',
          department: 'Vận hành bay',
          position: 'Nhân viên check-in',
          role: 'staff',
          status: 'active',
          hireDate: '2024-01-01',
          lastLogin: '2024-01-15',
          permissions: ['flights.read', 'bookings.read', 'bookings.write']
        },
        {
          id: '2',
          employeeCode: 'NV002',
          fullName: 'Trần Thị B',
          email: 'tranthib@baynhanh.vn',
          phone: '0987654321',
          department: 'Dịch vụ khách hàng',
          position: 'Quản lý',
          role: 'manager',
          status: 'active',
          hireDate: '2023-12-01',
          lastLogin: '2024-01-14',
          permissions: ['flights.read', 'flights.write', 'bookings.read', 'bookings.write', 'users.read']
        },
        {
          id: '3',
          employeeCode: 'AD001',
          fullName: 'Lê Văn C',
          email: 'levanc@baynhanh.vn',
          phone: '0369852147',
          department: 'IT',
          position: 'Quản trị hệ thống',
          role: 'admin',
          status: 'active',
          hireDate: '2023-06-01',
          lastLogin: '2024-01-15',
          permissions: ['flights.read', 'flights.write', 'flights.delete', 'bookings.read', 'bookings.write', 'users.read', 'users.write', 'system.settings']
        }
      ];
      
      setStaff(mockStaff);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    try {
      console.log('Adding staff:', newStaff);
      setShowAddModal(false);
      setNewStaff({
        employeeCode: '',
        fullName: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        role: 'staff',
        password: '',
        permissions: []
      });
      fetchStaff();
    } catch (error) {
      console.error('Error adding staff:', error);
    }
  };

  const handleEditStaff = async () => {
    try {
      console.log('Editing staff:', selectedStaff);
      setShowEditModal(false);
      setSelectedStaff(null);
      fetchStaff();
    } catch (error) {
      console.error('Error editing staff:', error);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
      try {
        console.log('Deleting staff:', staffId);
        fetchStaff();
      } catch (error) {
        console.error('Error deleting staff:', error);
      }
    }
  };

  // Removed unused handleStatusChange to satisfy noUnusedLocals

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Hoạt động';
      case 'inactive': return 'Không hoạt động';
      default: return status;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'staff': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Quản trị';
      case 'manager': return 'Quản lý';
      case 'staff': return 'Nhân viên';
      default: return role;
    }
  };

  const filteredStaff = staff.filter(member => {
    const matchesDepartment = !filters.department || member.department === filters.department;
    const matchesRole = !filters.role || member.role === filters.role;
    const matchesStatus = !filters.status || member.status === filters.status;
    const matchesSearch = !filters.search || 
      member.employeeCode.toLowerCase().includes(filters.search.toLowerCase()) ||
      member.fullName.toLowerCase().includes(filters.search.toLowerCase()) ||
      member.email.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesDepartment && matchesRole && matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý Nhân viên</h1>
        <p className="text-gray-600">Quản lý tài khoản nhân viên hệ thống</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
            <input
              type="text"
              placeholder="Mã NV, tên, email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phòng ban</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filters.department}
              onChange={(e) => setFilters({...filters, department: e.target.value})}
            >
              <option value="">Tất cả</option>
              <option value="Vận hành bay">Vận hành bay</option>
              <option value="Dịch vụ khách hàng">Dịch vụ khách hàng</option>
              <option value="IT">IT</option>
              <option value="Kế toán">Kế toán</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vai trò</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filters.role}
              onChange={(e) => setFilters({...filters, role: e.target.value})}
            >
              <option value="">Tất cả</option>
              <option value="admin">Quản trị</option>
              <option value="manager">Quản lý</option>
              <option value="staff">Nhân viên</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="">Tất cả</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Danh sách Nhân viên</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Thêm Nhân viên
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã NV</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thông tin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phòng ban</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStaff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {member.employeeCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{member.fullName}</div>
                    <div className="text-sm text-gray-500">{member.email}</div>
                    <div className="text-sm text-gray-500">{member.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{member.department}</div>
                    <div className="text-sm text-gray-500">{member.position}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(member.role)}`}>
                      {getRoleText(member.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.status)}`}>
                      {getStatusText(member.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedStaff(member);
                        setShowEditModal(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900 mr-2"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(member.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredStaff.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">Không tìm thấy nhân viên nào</div>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-1/2 max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Thêm Nhân viên mới</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mã nhân viên</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={newStaff.employeeCode}
                    onChange={(e) => setNewStaff({...newStaff, employeeCode: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Họ tên</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={newStaff.fullName}
                    onChange={(e) => setNewStaff({...newStaff, fullName: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phòng ban</label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={newStaff.department}
                    onChange={(e) => setNewStaff({...newStaff, department: e.target.value})}
                  >
                    <option value="">Chọn phòng ban</option>
                    <option value="Vận hành bay">Vận hành bay</option>
                    <option value="Dịch vụ khách hàng">Dịch vụ khách hàng</option>
                    <option value="IT">IT</option>
                    <option value="Kế toán">Kế toán</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Chức vụ</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={newStaff.position}
                    onChange={(e) => setNewStaff({...newStaff, position: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vai trò</label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({...newStaff, role: e.target.value as any})}
                  >
                    <option value="staff">Nhân viên</option>
                    <option value="manager">Quản lý</option>
                    <option value="admin">Quản trị</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                  <input
                    type="password"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quyền hạn</label>
                <div className="grid grid-cols-3 gap-2">
                  {availablePermissions.map((permission) => (
                    <label key={permission} className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        checked={newStaff.permissions.includes(permission)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewStaff({
                              ...newStaff,
                              permissions: [...newStaff.permissions, permission]
                            });
                          } else {
                            setNewStaff({
                              ...newStaff,
                              permissions: newStaff.permissions.filter(p => p !== permission)
                            });
                          }
                        }}
                      />
                      <span className="ml-2 text-sm text-gray-700">{permission}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleAddStaff}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  Thêm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && selectedStaff && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-1/2 max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Sửa Nhân viên</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mã nhân viên</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={selectedStaff.employeeCode}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Họ tên</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={selectedStaff.fullName}
                    readOnly
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={selectedStaff.email}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={selectedStaff.phone}
                    readOnly
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phòng ban</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={selectedStaff.department}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Chức vụ</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={selectedStaff.position}
                    readOnly
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vai trò</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={getRoleText(selectedStaff.role)}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={selectedStaff.status}
                    onChange={(e) => setSelectedStaff({...selectedStaff, status: e.target.value as any})}
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleEditStaff}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffAdmin;


