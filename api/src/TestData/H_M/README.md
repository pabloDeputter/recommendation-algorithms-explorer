# H&M Personalized Fashion Recommendations Dataset

##### Source:  https://www.kaggle.com/c/h-and-m-personalized-fashion-recommendations/data

This dataset contains purchases of a retail store and information about customers and articles.

## Changes to Original Dataset

- Subsampled to purchases in 2020.
- Removed articles and customers without purchases in this period.
- Remap UUIDs of customers to numeric IDs to reduce size.
- Added `image_url` column to `articles.csv` that links to a hosted image of the article.

## Hosted Images

Because downloading and serving all images would require a prohibitively large (and redundant) chunk of disk space for
all teams, we already hosted them for you.

All images in the dataset are hosted on `https://data.ua-ppdb.me/images/H_M/<article_id[:3]>/<article_id>.jpg` for
example: <https://data.ua-ppdb.me/images/H_M/010/0108775015.jpg>. Urls are already included in the dataset so this link
doesn't have to be hardcoded into the application.

To increase the loading speed, all images also have thumbnails of 25% size available. They can be requested by
appending `?thumbnail=1` to the url.

> Note: The query parameter for thumbnails _is_ allowed to be hardcoded into the application as it shouldn't impact loading images from other sources that don't use the query parameter (when other datasets are used for example).
