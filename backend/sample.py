import pymongo
if __name__=="__main__":
    client=pymongo.MongoClient("mongodb://localhost:27017/")
    print(client)
    db=client['odoo_gandhinagar']
    db.create_collection('signin')
    db.create_collection('vehicles')
    db.create_collection('drivers')
    db.create_collection('trips')
    db.create_collection('maintenance_logs')
    db.create_collection(' fuel_logs')
    db.create_collection('expenses')
    
    
    