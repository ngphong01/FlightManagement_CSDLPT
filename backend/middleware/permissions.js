// Permission management system for staff
const PERMISSION_PRESETS = {
  super_admin: {
    flights: { read: true, write: true, delete: true, approve: true },
    bookings: { read: true, write: true, cancel: true, refund: true },
    customers: { read: true, update: true, delete: true },
    staff: { read: true, create: true, update: true, delete: true },
    reports: { read: true, export: true },
    system: { settings: true, maintenance: true }
  },
  
  flight_operations_admin: {
    flights: { read: true, write: true, delete: false, approve: true },
    bookings: { read: true, write: false, cancel: false, refund: false },
    customers: { read: true, update: false, delete: false },
    staff: { read: false, create: false, update: false, delete: false },
    reports: { read: true, export: true },
    system: { settings: false, maintenance: false }
  },
  
  customer_service_admin: {
    flights: { read: true, write: false, delete: false, approve: false },
    bookings: { read: true, write: true, cancel: true, refund: true },
    customers: { read: true, update: true, delete: false },
    staff: { read: false, create: false, update: false, delete: false },
    reports: { read: true, export: false },
    system: { settings: false, maintenance: false }
  },
  
  reporting_admin: {
    flights: { read: true, write: false, delete: false, approve: false },
    bookings: { read: true, write: false, cancel: false, refund: false },
    customers: { read: true, update: false, delete: false },
    staff: { read: false, create: false, update: false, delete: false },
    reports: { read: true, export: true },
    system: { settings: false, maintenance: false }
  }
};

class PermissionManager {
  // Get permissions for a staff member
  static async getStaffPermissions(staffId, db) {
    try {
      const [permissions] = await db.query(
        'SELECT permission_code FROM staff_permissions WHERE staff_id = ?',
        [staffId]
      );
      
      if (permissions.length === 0) {
        return null; // No permissions assigned
      }
      
      // Get the first permission (assuming one permission per staff)
      const permissionCode = permissions[0].permission_code;
      return PERMISSION_PRESETS[permissionCode] || null;
    } catch (error) {
      console.error('Error getting staff permissions:', error);
      return null;
    }
  }
  
  // Check if staff has specific permission
  static hasPermission(permissions, resource, action) {
    if (!permissions || !permissions[resource]) {
      return false;
    }
    return permissions[resource][action] === true;
  }
  
  // Check multiple permissions (all must be true)
  static hasAllPermissions(permissions, requirements) {
    return requirements.every(req => 
      this.hasPermission(permissions, req.resource, req.action)
    );
  }
  
  // Check multiple permissions (any can be true)
  static hasAnyPermission(permissions, requirements) {
    return requirements.some(req => 
      this.hasPermission(permissions, req.resource, req.action)
    );
  }
}

// Middleware to require specific permission
const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      const staff = req.staff;
      
      if (!staff) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'Staff authentication required'
        });
      }
      
      // Get staff permissions
      const permissions = await PermissionManager.getStaffPermissions(staff.id, req.db);
      
      if (!permissions) {
        return res.status(403).json({ 
          error: 'No permissions assigned',
          message: 'Contact administrator to assign permissions'
        });
      }
      
      // Check specific permission
      const hasPermission = PermissionManager.hasPermission(permissions, resource, action);
      
      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          message: `Required: ${resource}.${action}`,
          staff: {
            id: staff.id,
            employee_code: staff.employee_code,
            role: staff.role
          }
        });
      }
      
      // Add permissions to request for use in controllers
      req.permissions = permissions;
      next();
      
    } catch (error) {
      console.error('Permission middleware error:', error);
      return res.status(500).json({ 
        error: 'Permission check failed',
        message: 'Internal server error during permission verification'
      });
    }
  };
};

// Middleware to require any of multiple permissions
const requireAnyPermission = (requirements) => {
  return async (req, res, next) => {
    try {
      const staff = req.staff;
      
      if (!staff) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'Staff authentication required'
        });
      }
      
      const permissions = await PermissionManager.getStaffPermissions(staff.id, req.db);
      
      if (!permissions) {
        return res.status(403).json({ 
          error: 'No permissions assigned',
          message: 'Contact administrator to assign permissions'
        });
      }
      
      const hasAny = PermissionManager.hasAnyPermission(permissions, requirements);
      
      if (!hasAny) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          message: `Required any of: ${requirements.map(r => `${r.resource}.${r.action}`).join(', ')}`,
          staff: {
            id: staff.id,
            employee_code: staff.employee_code,
            role: staff.role
          }
        });
      }
      
      req.permissions = permissions;
      next();
      
    } catch (error) {
      console.error('Permission middleware error:', error);
      return res.status(500).json({ 
        error: 'Permission check failed',
        message: 'Internal server error during permission verification'
      });
    }
  };
};

// Middleware to require all of multiple permissions
const requireAllPermissions = (requirements) => {
  return async (req, res, next) => {
    try {
      const staff = req.staff;
      
      if (!staff) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'Staff authentication required'
        });
      }
      
      const permissions = await PermissionManager.getStaffPermissions(staff.id, req.db);
      
      if (!permissions) {
        return res.status(403).json({ 
          error: 'No permissions assigned',
          message: 'Contact administrator to assign permissions'
        });
      }
      
      const hasAll = PermissionManager.hasAllPermissions(permissions, requirements);
      
      if (!hasAll) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          message: `Required all of: ${requirements.map(r => `${r.resource}.${r.action}`).join(', ')}`,
          staff: {
            id: staff.id,
            employee_code: staff.employee_code,
            role: staff.role
          }
        });
      }
      
      req.permissions = permissions;
      next();
      
    } catch (error) {
      console.error('Permission middleware error:', error);
      return res.status(500).json({ 
        error: 'Permission check failed',
        message: 'Internal server error during permission verification'
      });
    }
  };
};

module.exports = {
  PermissionManager,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  PERMISSION_PRESETS
};
