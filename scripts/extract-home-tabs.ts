import fs from 'fs';

const content = fs.readFileSync('src/views/common/HomeView.tsx', 'utf-8');

const tSekolah = content.indexOf("{activeSubTab === 'sekolah' && (");
const tWaliKelas = content.indexOf("{activeSubTab === 'walikelas' && isWaliKelas && (");
const tStatistik = content.indexOf("{activeSubTab === 'statistik' && (");
const tKelas = content.indexOf("{activeSubTab === 'kelas' && (");
const tEnd = content.lastIndexOf("</motion.div>");

function extractBlock(start, endStr) {
  const e = content.indexOf(endStr, start);
  return content.substring(start, e);
}

let sekolahCode = extractBlock(tSekolah, "{activeSubTab === 'walikelas' && isWaliKelas && (");
let walikelasCode = extractBlock(tWaliKelas, "{activeSubTab === 'statistik' && (");
let statistikCode = extractBlock(tStatistik, "{activeSubTab === 'kelas' && (");
let kelasCode = content.substring(tKelas, tEnd);

function cleanJSX(jsx, prefixStr) {
  let c = jsx.trim();
  if (c.startsWith(prefixStr)) {
    c = c.substring(prefixStr.length);
  }
  const lastIdx = c.lastIndexOf(')}');
  if (lastIdx !== -1) {
    c = c.substring(0, lastIdx);
  }
  return c;
}

sekolahCode = cleanJSX(sekolahCode, "{activeSubTab === 'sekolah' && (");
walikelasCode = cleanJSX(walikelasCode, "{activeSubTab === 'walikelas' && isWaliKelas && (");
statistikCode = cleanJSX(statistikCode, "{activeSubTab === 'statistik' && (");
kelasCode = cleanJSX(kelasCode, "{activeSubTab === 'kelas' && (");

const imports = `import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { School, Layers, Upload, Download, Users, Trash2, ArrowRight, CheckCircle2, UserPlus, Info, Calendar, UserX, UserCheck, BarChart3 } from 'lucide-react';
import { Kelas, Pengguna } from '../../../types';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line } from 'recharts';
import ProfilView from '../ProfilView';
import WaliKelasView from '../../wali-kelas/WaliKelasView';
`;

function writeTab(name, jsx) {
  fs.writeFileSync(`src/views/common/tabs/${name}.tsx`, `${imports}
export default function ${name}(props: any) {
  const { currentUser, classes, schoolIdentity, theme, stats, isWaliKelas, onNavigateToTab, onOpenAddKelasModal, onOpenAddSiswaModal } = props;
  return (
    ${jsx}
  );
}
`);
}

writeTab('HomeSekolahTab', sekolahCode);
writeTab('HomeWaliKelasTab', walikelasCode);
writeTab('HomeStatistikTab', statistikCode);
writeTab('HomeKelasTab', kelasCode);

console.log('Home tabs extracted');
