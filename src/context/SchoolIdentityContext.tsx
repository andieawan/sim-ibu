import React, { createContext, useContext, useState, useEffect } from 'react';

export interface SchoolIdentity {
  nama_sekolah: string;
  motto: string;
  alamat: string;
  npsn: string;
  kepala_sekolah: string;
  tahun_pelajaran?: string;
  semester?: string;
  logo: string;
}

interface SchoolIdentityContextType {
  schoolIdentity: SchoolIdentity;
  loading: boolean;
  refresh: () => Promise<void>;
}

const defaultIdentity: SchoolIdentity = {
  nama_sekolah: 'SMKS Islam Bustanul Ulum',
  motto: 'SISTEM INFORMASI DAN MANAJEMEN - SMKS ISLAM BUSTANUL ULUM',
  alamat: 'Jl. Pendidikan No. 45, Kecamatan Bojong',
  npsn: '12345678',
  kepala_sekolah: 'Drs. H. Ahmad Sudrajat, M.Pd',
  tahun_pelajaran: '2024/2025',
  semester: 'Ganjil',
  logo: ''
};

const SchoolIdentityContext = createContext<SchoolIdentityContextType | undefined>(undefined);

export function SchoolIdentityProvider({ children }: { children: React.ReactNode }) {
  const [schoolIdentity, setSchoolIdentity] = useState<SchoolIdentity>(defaultIdentity);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSchoolIdentity = async () => {
    try {
      const res = await fetch('/api/school-identity');
      if (res.ok) {
        const data = await res.json();
        setSchoolIdentity(data);
      }
    } catch (err) {
      console.error('Error fetching school identity:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchoolIdentity();
  }, []);

  return (
    <SchoolIdentityContext.Provider value={{ schoolIdentity, loading, refresh: fetchSchoolIdentity }}>
      {children}
    </SchoolIdentityContext.Provider>
  );
}

export function useSchoolIdentity() {
  const context = useContext(SchoolIdentityContext);
  if (context === undefined) {
    throw new Error('useSchoolIdentity must be used within a SchoolIdentityProvider');
  }
  return context;
}
