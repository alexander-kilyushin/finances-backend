#!/bin/bash

# This script will be executed automatically before each test.

psql $DATABASE_NAME $DATABASE_USERNAME -c "\
TRUNCATE \
finance_category, \
finance_category_type, \
finance_record, \
\"user\" \
CASCADE";
