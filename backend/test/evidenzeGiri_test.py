import copy, importlib.util, pathlib, unittest
from datetime import datetime, timedelta, timezone
p=pathlib.Path(__file__).resolve().parents[1]/'scripts/analizzaEvidenzeGiri.py'
spec=importlib.util.spec_from_file_location('analizza',p);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Filtri(unittest.TestCase):
 def setUp(self):
  t=datetime(2026,1,1,tzinfo=timezone.utc)
  self.date=lambda n:(t+timedelta(seconds=100*n)).isoformat()
  self.raw={'drivers':[{'driver_number':i,'name_acronym':str(i),'team_name':'T'} for i in range(1,7)],'laps':[], 'stints':[], 'weather':[], 'intervals':[], 'pit':[], 'race_control':[]}
  for n in range(1,21):
   self.raw['weather'].append({'date':self.date(n),'rainfall':0})
   for d in range(1,7):
    self.raw['laps'].append({'driver_number':d,'lap_number':n,'lap_duration':99+d/10,'date_start':self.date(n),'is_pit_out_lap':False})
    self.raw['intervals'].append({'driver_number':d,'date':self.date(n),'interval':2,'gap_to_leader':d*2})
  self.raw['stints']=[{'driver_number':d,'stint_number':1,'lap_start':1,'lap_end':20,'compound':'HARD','tyre_age_at_start':0} for d in range(1,7)]
 def result(self):return m.analizza({},self.raw,{str(i):str(i) for i in range(1,7)})
 def test_comparable_and_rank(self):
  r=self.result();self.assertEqual(r[0]['giriComparabili'],18);self.assertEqual(r[0]['passo']['overall'],100);self.assertEqual(r[-1]['passo']['overall'],0)
 def test_pit_and_traffic_excluded(self):
  self.raw['pit']=[{'driver_number':1,'lap_number':8}]
  self.raw['intervals'][next(i for i,x in enumerate(self.raw['intervals']) if x['driver_number']==1 and x['date']==self.date(15))]['interval']=0.5
  r=self.result()[0];self.assertEqual(r['giriEsclusi']['partenza_o_pit'],5);self.assertEqual(r['giriEsclusi']['traffico'],1)
 def test_rain_does_not_become_dry_pace(self):
  for w in self.raw['weather']:w['rainfall']=1
  self.assertTrue(all(p['passo']['overall'] is None for p in self.result()))
 def test_stint_ambiguity_and_neutralisation(self):
  self.raw['stints'].append(copy.deepcopy(self.raw['stints'][0]))
  self.raw['race_control']=[{'date':self.date(8),'message':'SAFETY CAR DEPLOYED','flag':None},{'date':self.date(10),'message':'SAFETY CAR IN THIS LAP','flag':None}]
  r=self.result();self.assertEqual(r[0]['giriComparabili'],0);self.assertGreater(r[1]['giriEsclusi']['bandiere_o_neutralizzazione'],0)
 def test_slope_requires_length_and_span(self):
  self.assertIsNone(m.pendenza([(i,i*.01) for i in range(9)]));self.assertAlmostEqual(m.pendenza([(i,i*.01) for i in range(12)]),.01)
if __name__=='__main__':unittest.main()
