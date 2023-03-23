select count(*) as eth2_count, bin_to_uuid(res.id) as resourceid, bin_to_uuid(org.id) as orgid, org.name  from resources as res join organizations as org on org.id=res.owner where [[bin_to_uuid(org.id)={{orgid}} and]] res.deleted is null and res.type='eth2' group by org.id ;


