Request	Expected result

/api/admin/users                        	First 10 users
/api/admin/users?page=2                 	Next 10 users
/api/admin/users?page=1&limit=5            	First 5 users
/api/admin/users?search=saurabh	            Users matching the search