const fs = require('fs');
let content = fs.readFileSync('kelas-debug.txt', 'utf-8');

// Find the start of the return div
let startIdx = content.indexOf('<div');
if (startIdx === -1) startIdx = 0;

// Find the last closing div of the block
let endIdx = content.lastIndexOf(')}');
let block = content.substring(startIdx, endIdx).trim();

const imports = `import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { School, Layers, Upload, Download, Users, Trash2, ArrowRight, CheckCircle2, UserPlus, Info, Calendar, UserX, UserCheck, BarChart3 } from 'lucide-react';
import { Kelas, Pengguna } from '../../../types';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line } from 'recharts';

export default function HomeKelasTab(props: any) {
  const { classes, theme, onNavigateToTab, onOpenAddKelasModal } = props;
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  
  const handleReactivateSiswa = (nis: string) => {};
  const handleNonaktifkanSiswa = (nis: string) => {};
  
  return (
    ${block}
  );
}
`;

fs.writeFileSync('src/views/common/tabs/HomeKelasTab.tsx', imports);
