#!/usr/bin/env python3
"""
Test PostgreSQL Connection and Basic Functionality

This script tests:
1. Database connection
2. Schema creation
3. Sample data population
4. Basic queries

Run this before running the main tests to ensure PostgreSQL is properly configured.
"""

import sys
import traceback
from db_config import get_db_config, print_config
import db

def test_connection():
    """Test basic database connection"""
    print("Testing PostgreSQL connection...")
    try:
        conn = db.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT version()")
        result = cur.fetchone()
        if result:
            version = result[0]
            print(f"✅ Connected successfully!")
            print(f"   PostgreSQL version: {version}")
        else:
            print("✅ Connected successfully!")
            print("   PostgreSQL version: Unknown")
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def test_schema_creation():
    """Test schema creation"""
    print("\nTesting schema creation...")
    try:
        db.init_db(sample=False)
        print("✅ Schema created successfully!")
        return True
    except Exception as e:
        print(f"❌ Schema creation failed: {e}")
        print(f"   Full error: {traceback.format_exc()}")
        return False

def test_sample_data():
    """Test sample data population"""
    print("\nTesting sample data population...")
    try:
        db.init_db(sample=True)
        
        # Verify data was created
        conn = db.get_connection()
        cur = conn.cursor()
        
        # Check exercises
        cur.execute("SELECT COUNT(*) FROM exercises")
        result = cur.fetchone()
        exercise_count = result[0] if result else 0
        
        # Check daily logs
        cur.execute("SELECT COUNT(*) FROM daily_logs")
        result = cur.fetchone()
        log_count = result[0] if result else 0
        
        # Check planned sets
        cur.execute("SELECT COUNT(*) FROM planned_sets")
        result = cur.fetchone()
        planned_count = result[0] if result else 0
        
        # Check completed sets
        cur.execute("SELECT COUNT(*) FROM completed_sets")
        result = cur.fetchone()
        completed_count = result[0] if result else 0
        
        conn.close()
        
        print(f"✅ Sample data created successfully!")
        print(f"   Exercises: {exercise_count}")
        print(f"   Daily logs: {log_count}")
        print(f"   Planned sets: {planned_count}")
        print(f"   Completed sets: {completed_count}")
        
        return True
    except Exception as e:
        print(f"❌ Sample data creation failed: {e}")
        print(f"   Full error: {traceback.format_exc()}")
        return False

def test_basic_queries():
    """Test basic queries"""
    print("\nTesting basic queries...")
    try:
        conn = db.get_connection()
        cur = conn.cursor()
        
        # Test a join query
        cur.execute("""
            SELECT e.name, COUNT(ps.id) as planned_sets
            FROM exercises e
            LEFT JOIN planned_sets ps ON e.id = ps.exercise_id
            GROUP BY e.id, e.name
            ORDER BY planned_sets DESC
            LIMIT 5
        """)
        
        results = cur.fetchall()
        conn.close()
        
        print("✅ Basic queries working!")
        print("   Top exercises by planned sets:")
        for row in results:
            print(f"     - {row[0]}: {row[1]} sets")
        
        return True
    except Exception as e:
        print(f"❌ Basic queries failed: {e}")
        print(f"   Full error: {traceback.format_exc()}")
        return False

def main():
    """Run all tests"""
    print("PostgreSQL Workout Tracker - Connection Test")
    print("=" * 50)
    
    # Print configuration
    print_config()
    print()
    
    # Run tests
    tests = [
        test_connection,
        test_schema_creation,
        test_sample_data,
        test_basic_queries
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        else:
            print("\n❌ Test failed. Check your PostgreSQL configuration.")
            print("\nTroubleshooting:")
            print("1. Ensure PostgreSQL is running on 192.168.1.93:5432")
            print("2. Database 'workout_tracker' exists")
            print("3. User has proper permissions")
            print("4. Network connectivity to PostgreSQL server")
            break
    
    print(f"\n{'='*50}")
    if passed == total:
        print(f"🎉 All tests passed! ({passed}/{total})")
        print("PostgreSQL setup is ready for the workout tracker!")
    else:
        print(f"⚠️  Tests failed: {passed}/{total} passed")
        sys.exit(1)

if __name__ == "__main__":
    main() 