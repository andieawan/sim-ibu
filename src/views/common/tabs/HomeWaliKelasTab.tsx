import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { School, Layers, Upload, Download, Users, Trash2, ArrowRight, CheckCircle2, UserPlus, Info, Calendar, UserX, UserCheck, BarChart3 } from 'lucide-react';
import { Kelas, Pengguna } from '../../../types';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line } from 'recharts';
import ProfilView from '../ProfilView';
import WaliKelasView from '../../wali-kelas/WaliKelasView';

export default function HomeWaliKelasTab(props: any) {
  const {
    currentUser, classes, schoolIdentity, theme, stats, isWaliKelas, onNavigateToTab, onOpenAddKelasModal, onOpenAddSiswaModal,
    loadingClasses, displayedClasses, selectedClassForView, setSelectedClassForView, setSiswaListForView, handleViewSiswa, handleDeleteKelas,
    classStats, loadingSiswa, siswaListForView, handleDeactivateSiswa, handleReactivateSiswa,
    schedules, selectedDayFilter, setSelectedDayFilter, loadingSchedules,
    showStats, setShowStats, onRefreshClasses
  } = props;
  return (
    
        <WaliKelasView
          currentUser={currentUser}
          classes={classes}
          onNavigateToTab={onNavigateToTab}
        />
      
  );
}
