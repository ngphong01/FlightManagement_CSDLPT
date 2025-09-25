 
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import MyBooking from './pages/MyBooking';
import CheckIn from './pages/CheckIn';
import Booking from './pages/Booking';
import Support from './pages/Support';
import News from './pages/News';
import FlightDetail from './pages/FlightDetail';
import PassengerInfo from './pages/PassengerInfo';
import Payment from './pages/Payment';
import Confirmation from './pages/Confirmation';
import AuthLogin from './pages/AuthLogin';
import AuthRegister from './pages/AuthRegister';
import PromotionDetail from './pages/PromotionDetail';
import ArticleDetail from './pages/ArticleDetail';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';
import AdminDashboard from './pages/admin/Dashboard';
import FlightsAdmin from './pages/admin/Flights';
import BookingsAdmin from './pages/admin/Bookings';
import UsersAdmin from './pages/admin/Users';
import StaffAdmin from './pages/admin/Staff';
import ReportsAdmin from './pages/admin/Reports';
import SystemAdmin from './pages/admin/System';
import FlightsSchedule from './pages/admin/FlightsSchedule';
import Aircrafts from './pages/admin/Aircrafts';
import RoutesAdmin from './pages/admin/Routes';
import StaffLogin from './pages/staff/Login';
import CheckinDashboard from './pages/staff/CheckinDashboard';
import GateDashboard from './pages/staff/GateDashboard';
import EmergencyDashboard from './pages/staff/EmergencyDashboard';
import TestPage from './pages/staff/TestPage';
import SimpleLogin from './pages/staff/SimpleLogin';
import AdminLogin from './pages/admin/AdminLogin';
import ProtectedStaffRoute from './components/staff/ProtectedStaffRoute';
import StaffLayout from './components/staff/StaffLayout';
import GuestBookingFlow from './pages/GuestBookingFlow';
import GuestBookingLookup from './pages/GuestBookingLookup';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/flight/:flightId" element={<FlightDetail />} />
        <Route path="/passenger" element={<PassengerInfo />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="/my-booking" element={<MyBooking />} />
        <Route path="/check-in" element={<CheckIn />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/guest/booking" element={<GuestBookingFlow />} />
        <Route path="/guest/lookup" element={<GuestBookingLookup />} />
        <Route path="/support" element={<Support />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/promotion/:id" element={<PromotionDetail />} />
        <Route path="/news/article/:id" element={<ArticleDetail />} />
        <Route path="/auth/login" element={<AuthLogin />} />
        <Route path="/auth/register" element={<AuthRegister />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        {/* Admin */}
        <Route path="/admin" element={<ProtectedAdminRoute />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="flights" element={<FlightsAdmin />} />
          <Route path="flights/schedule" element={<FlightsSchedule />} />
          <Route path="flights/aircrafts" element={<Aircrafts />} />
          <Route path="flights/routes" element={<RoutesAdmin />} />
          <Route path="bookings" element={<BookingsAdmin />} />
          <Route path="users" element={<UsersAdmin />} />
          <Route path="staff" element={<StaffAdmin />} />
          <Route path="reports" element={<ReportsAdmin />} />
          <Route path="system" element={<SystemAdmin />} />
        </Route>
        {/* Staff */}
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route path="/staff/simple-login" element={<SimpleLogin />} />
        <Route path="/staff" element={<ProtectedStaffRoute><StaffLayout /></ProtectedStaffRoute>}>
          <Route path="checkin" element={<CheckinDashboard />} />
          <Route path="gate" element={<GateDashboard />} />
          <Route path="emergency" element={<EmergencyDashboard />} />
          <Route path="test" element={<TestPage />} />
        </Route>
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
