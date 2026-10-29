import datetime as dt
import math
import pathlib
import sys
import unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts'))
from completaDatiCircuiti import geometria, gruppi_circolari, metrica_telemetrica

class RaccoltaTest(unittest.TestCase):
    def test_rettilineo_a_cavallo_del_traguardo(self):
        self.assertEqual(gruppi_circolari([True,True,False,True]),[[3,0,1]])
        self.assertEqual(gruppi_circolari([False,False]),[])

    def test_geometria_rettangolare_e_rotazione_punto_iniziale(self):
        # Circa 1 km x 500 m; conta tutti e quattro i rettilinei, anche al traguardo.
        p=[[0,0],[1000/111320,0],[1000/111320,500/111320],[0,500/111320]]
        a=geometria(p,3);b=geometria(p[1:]+p[:1],3)
        self.assertEqual(a['numeroRettilinei'],4)
        self.assertEqual(b['numeroRettilinei'],4)
        self.assertLess(abs(a['lunghezzaRettilineiKm']-b['lunghezzaRettilineiKm']),.05)
        self.assertTrue(2<a['lunghezzaRettilineiKm']<3)

    def test_g_laterale_cinematico_su_cerchio_noto(self):
        start=dt.datetime(2024,1,1,tzinfo=dt.timezone.utc)
        car=[];loc=[];v=100/3.6;r=100;omega=v/r
        for i in range(160):
            t=i*.25;date=(start+dt.timedelta(seconds=t)).isoformat()
            car.append({'date':date,'speed':100,'brake':0})
            loc.append({'date':date,'x':r*math.cos(omega*t),'y':r*math.sin(omega*t)})
        m=metrica_telemetrica(car,loc)
        self.assertAlmostEqual(m['gLateraleMedia'],v*v/r/9.80665,delta=.05)
        self.assertAlmostEqual(m['velocitaCurveKmh'],100,delta=.01)
        self.assertIsNone(m['gFrenataMedia'])

if __name__=='__main__':unittest.main()
