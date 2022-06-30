from typing import Optional

import numpy as np
import scipy.sparse
from scipy.sparse import csr_matrix
from sqlalchemy import text


class Popularity:
    def __init__(self, window_size: int = 10, retrain_interval: int = 10):
        self.window_size = window_size
        self.retrain_interval = retrain_interval
        # Popularity matrix
        self.items_popularity: Optional[scipy.sparse.csr_matrix] = None

    def run(self, x: scipy.sparse.csr_matrix) -> Optional[csr_matrix]:
        return self.__fit(x).__predict(x)

    def retrain(self, date, dataset, k):
        # Return a query that'll return the Top-K most bought items of the past {window_size} days
        return text(
            f'SELECT item_id FROM (\n'
            f'SELECT item_id,\n' +
            f'       sum(item_count) OVER (PARTITION BY item_id ORDER BY purchase_date\n' +
            f'           ROWS BETWEEN {self.window_size} PRECEDING AND CURRENT ROW)\n' +
            f'           as total_interactions\n' +
            f'FROM items_day_count\n' +
            f'WHERE purchase_date = \'{date}\' AND dataset_name=\'{dataset}\'\n'
            f'ORDER BY total_interactions DESC LIMIT {k}) as tmp;'
        )

    def __fit(self, x: scipy.sparse.csr_matrix) -> 'Popularity':
        # Get popularity of each item
        items_popularity = np.asarray(x.sum(0))
        # Create index for each item
        col_index: np.ndarray = np.arange(items_popularity.shape[1])
        # Add index row as 2'nd row to array
        items_popularity: np.ndarray = np.vstack([items_popularity, col_index])
        # Sort array by values in first row in descending order
        result: np.ndarray = items_popularity[:, np.flip(np.argsort(items_popularity[0]))]
        # Applying window size
        result = result[:, :self.window_size]
        # result = np.resize(result, (result.shape[0], self.window_size))  # Cutting all products that aren't wanted
        self.items_popularity = result
        return self

    def __predict(self, histories: scipy.sparse.csr_matrix) -> Optional[csr_matrix]:
        return self.items_popularity


if __name__ == "__main__":
    a = Popularity(window_size=5)
    print(a.run(scipy.sparse.csr_matrix([[10, 2, 12], [1, 2, 3], [1, 2, 3], [5, 1, 8], [1, 9, 4], [9, 9, 9]])))
