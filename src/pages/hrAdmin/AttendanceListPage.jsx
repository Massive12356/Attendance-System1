import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Printer as Print,
  Calendar,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BadgeCheck
} from "lucide-react";
import { motion } from "framer-motion";
import sukuLogo from "../../assets/logo.png";
import useAttendanceStore from "../../../store/useAttendanceStore"; // from zustand
import { exportToExcel } from "../../utils/exportToExcel";

const AttendanceListPage = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(false);
  const [viewMode, setViewMode] = useState("");
  const tableRef = useRef();

  const { attendees, fetchAllAttendees, loading } = useAttendanceStore();

  useEffect(() => {
    fetchAllAttendees();
  }, [fetchAllAttendees]);

  const handlePrint = () => {
    const printContents = tableRef.current.innerHTML;
    const printWindow = window.open("", "", "height=600,width=800");

    printWindow.document.write("<html><head><title>Print Report</title>");
    printWindow.document.write(`
      <style>
             body {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    font-family: Arial, sans-serif;
    font-size: 12px; /* Make print text more compact */
  }

  table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #333;
  }

  th, td {
    border: 1px solid #333;
    padding: 6px 8px;
    text-align: center; /* ✅ Center all table content */
    vertical-align: middle; /* ✅ Center vertically too */
  }

  thead {
    background-color: #0d3b66; /* Dark blue for header */
    color: white;
  }

  tr:nth-child(even) {
    background-color: #f8f8f8; /* Light zebra stripes */
  }

  /* Watermark stays subtle */
  .print-watermark {
    position: fixed;
    top: 50%;
    left: 50%;
    width: 300px;
    height: 300px;
    transform: translate(-50%, -50%);
    opacity: 0.08;
    z-index: -1;
    pointer-events: none;
  }

  .print-watermark img {
    width: 100%;
    height: auto;
  }
      </style>
    `);
    printWindow.document.write("</head><body>");
    printWindow.document.write(`
      <div class="print-watermark">
        <img src="${window.location.origin}/assets/logo.png" alt="Company Watermark" />
      </div>
    `);
    printWindow.document.write(printContents);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // handling search and filter by date logic
  const filteredAttendees = attendees.filter((attendee) => {
    // Text search filter (safe with optional chaining)
    const matchSearch =
      attendee.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attendee.fullName?.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesDate = true;

    // Date filter only if a date is selected
    if (selectedDate) {
      const created = new Date(attendee.createdAt);
      const selected = new Date(selectedDate);

      // Ensure both dates are valid before comparing
      if (!isNaN(created.getTime()) && !isNaN(selected.getTime())) {
        matchesDate = created.toISOString().slice(0, 10) === selectedDate;
      } else {
        matchesDate = false;
      }
    }

    // Role filter
    let matchesRole = true;
    if (statusFilter && statusFilter !== "all") {
      matchesRole = attendee.role === statusFilter;
    }

    return matchSearch && matchesDate && matchesRole;
  });

  // handle export
  const handleExport = () => {
    if (!filteredAttendees.length) {
      toast.error("No attendance data to export.");
      return;
    }
    const dataToExport = filteredAttendees.map((entry) => ({
      "Staff ID": entry.staffID,
      "Full Name": entry.fullName,
      Position: entry.position,
      Contact: entry.contact,
      Role: entry.role,
      Email: entry.email,
    }));
    exportToExcel(
      dataToExport,
      "Attendance Report",
      `Attendance_Report_${new Date().toISOString().slice(0, 10)}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Watermark hidden from screen but useful for structure */}
      <div className="print-watermark hidden" aria-hidden="true">
        <img src={sukuLogo} alt="Company Watermark" />
      </div>

      {/* Top Nav */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Staff Details</h1>
        <p className="text-gray-600  mt-1">View and manage staff records</p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200  transition-all duration-200">
        <div className="space-y-4 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              placeholder="Search by name or position"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white  text-gray-900 transition-colors duration-200 "
            />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white  text-gray-900 transition-colors duration-200 "
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 transition-colors duration-200"
            >
              <option value="all">All Roles</option>
              <option value="member">member</option>
              <option value="admin">admin</option>
            </select>
            <div className="flex space-x-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setViewMode(viewMode === "table" ? "grid" : "table")
                }
                className="flex-1 inline-flex items-center justify-center font-medium rounded-lg transition-all border  cursor-pointer border-gray-300 shadow-sm duration-200"
              >
                {viewMode === "table" ? (
                  <Grid className="w-4 h-4" />
                ) : (
                  <List className="w-4 h-4" />
                )}
              </motion.button>

              <motion.button
                onClick={handleExport}
                whileTap={{ scale: 0.95 }}
                className="p-3 flex-1 inline-flex items-center justify-center font-medium rounded-lg transition-all shadow-sm duration-200 focus:outline-none  border cursor-pointer border-gray-300 hover:bg-gray-50 text-gray-700 "
              >
                <Download className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex-1 inline-flex items-center justify-center font-medium rounded-lg transition-all shadow-sm duration-200 focus:outline-none  border cursor-pointer border-gray-300 hover:bg-gray-50 text-gray-700 "
                onClick={handlePrint}
              >
                <Print className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Container (Scrolls only if overflow) */}
      {viewMode === "table" ? (
        <div className="overflow-x-auto" ref={tableRef}>
          <div className="border border-gray-200 rounded-t-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 rounded-t-lg">
                <tr>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff ID
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Full Name
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 d uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <svg
                          className="animate-spin h-10 w-10"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <defs>
                            <linearGradient
                              id="spinnerGradient"
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="0%"
                            >
                              <stop offset="0%" stopColor="#1e3a8a" />{" "}
                              {/* Deep Blue */}
                              <stop offset="50%" stopColor="#3b82f6" />{" "}
                              {/* Light Blue */}
                              <stop offset="100%" stopColor="#7c3aed" />{" "}
                              {/* Purple */}
                            </linearGradient>
                          </defs>
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="url(#spinnerGradient)"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="url(#spinnerGradient)"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          ></path>
                        </svg>
                        <span className="text-base font-semibold text-gray-700 animate-pulse">
                          Fetching attendance...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : filteredAttendees.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-6 text-gray-500">
                      No Attendees records found
                    </td>
                  </tr>
                ) : (
                  filteredAttendees.map((entry) => (
                    <tr
                      key={entry._id}
                      className="hover:bg-gray-50 transition-colors duration-200 border border-gray-200"
                    >
                      <td className="py-5  px-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entry.staffID}
                      </td>

                      <td className="py-4  flex gap-2 px-3 text-nowrap text-sm font-medium text-gray-900">
                        {entry.role === "admin" ? (
                          <BadgeCheck className="w-5 h-5 text-yellow-800" />
                        ) : (
                          ""
                        )}
                        {entry.fullName}
                      </td>
                      <td className="py-4  px-4 whitespace-nowrap  text-sm font-medium text-gray-900">
                        <p className="ml-1">{entry.position}</p>
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entry.email}
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entry.contact}
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        <span
                          className={`px-3 py-1 rounded-lg ${
                            entry.role === "admin"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {entry.role}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 col-span-full">
              <svg
                className="animate-spin h-10 w-10"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <defs>
                  <linearGradient
                    id="spinnerGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#1e3a8a" /> {/* Deep Blue */}
                    <stop offset="50%" stopColor="#3b82f6" /> {/* Light Blue */}
                    <stop offset="100%" stopColor="#7c3aed" /> {/* Purple */}
                  </linearGradient>
                </defs>
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="url(#spinnerGradient)"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="url(#spinnerGradient)"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
              <span className="text-base font-semibold text-gray-700 animate-pulse">
                Fetching attendance...
              </span>
            </div>
          ) : filteredAttendees.length === 0 ? (
            <p className="text-center text-gray-500 col-span-full">
              No Attendees records found
            </p>
          ) : (
            filteredAttendees.map((entry) => (
              <div
                key={entry._id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm p-7 hover:shadow-md transition relative"
              >
                {/* top bar with icon + name */}
                <div className="flex items-center gap-3">
                  <div>
                    {entry.role === "admin" ? (
                      <BadgeCheck className="w-5 h-5 text-yellow-800" />
                    ) : (
                      ""
                    )}
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {entry.fullName}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {entry.staffID} • {entry.position}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mt-2">{entry.email}</p>
                <p className="text-sm text-gray-500 mt-2">{entry.contact}</p>

                {/* role pill moved top-right */}
                <p
                  className={`absolute top-3 right-3 text-sm px-2 py-1 rounded-lg font-medium text-gray-700 ${
                    entry.role === "admin"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {entry.role}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceListPage;
