#
  # This file is part of Privacy Butler <privacybutler.com>
  # Copyright (C) 2014- Olga Musayev & others
  #
  #Privacy Butler is free software: you can redistribute it and/or modify
  # it under the terms of the GNU General Public License version 3 as
  # published by the Free Software Foundation.
  #
  # Privacy Butler is distributed in the hope that it will be useful,
  # but WITHOUT ANY WARRANTY; without even the implied warranty of
  # MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  # GNU General Public License for more details.
  #
  # You should have received a copy of the GNU General Public License
  # along with Privacy Butler.  If not, see <http://www.gnu.org/licenses/>.
 #


#Note that this step happens after the SQL database has been migrated to Google Cloud Storage

import predictionio
import logging
import os
import cloudstorage as gcs
import webapp2

from google.appengine.api import app_identity

default_retry_params = gcs.RetryParams(initial_delay=0.2,
                                          max_delay=5.0,
                                          backoff_factor=2,
                                          max_retry_period=15)
gcs.set_default_retry_params(default_retry_params)


client = predictionio.Client(appkey="<your app key>")

def get_connection():
    return rdbms.connect(instance=CLOUDSQL_INSTANCE, database=DATABASE_NAME,
                         user=USER_NAME, password=PASSWORD, charset='utf8')
						 
