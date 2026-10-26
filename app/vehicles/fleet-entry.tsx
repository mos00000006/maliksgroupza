'use client';
import Link from 'next/link';
import styles from './vehicles.module.css';
export default function FleetEntry(){return <Link className={styles.fleetEntry} href="/vehicles"><span>COMPANY VEHICLES</span><b>Vehicle QR logbook →</b><small>Current drivers · returns · trip history</small></Link>;}
