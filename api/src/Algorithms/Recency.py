from time import time
from typing import Optional

import numpy as np
import scipy.sparse
from sqlalchemy import text


class Recency:
    def __init__(self, window_size: int = 10, retrain_interval: int = 10):
        self.retrain_interval = retrain_interval
        self.last_training = time()
        self.window_size = window_size
        self.dates = np.ndarray
        self.items: Optional[np.ndarray] = None

    def run(self, x: scipy.sparse.csr_matrix, dates: np.ndarray = np.asarray([])) -> np.ndarray:
        assert (x.shape[1] == dates.shape[0])
        self.dates = dates
        return self.__fit(x).__predict()

    def retrain(self, date, dataset, k):
        # Return a query that'll return the Top-K items that were first interacted with the most recent
        return text(
            f'SELECT item_id FROM\n' +
            f'items_day_count NATURAL JOIN (SELECT item_id, min(purchase_date) AS recency FROM items_day_count GROUP BY item_id) AS recent\n' +
            f'WHERE purchase_date < \'{date}\' AND dataset_name=\'{dataset}\'' +
            f'ORDER BY recency DESC, item_count DESC LIMIT {k};'
        )

    def __fit(self, x: scipy.sparse.csr_matrix) -> 'Recency':
        # All items in this matrix are bought on the same day, calculate how much we should cut off
        self.items = np.asarray(x.sum(0))[0]
        # Create index for each item
        col_index: np.ndarray = np.arange(self.items.shape[0])
        self.items = self.items.transpose()
        # Add index row as 2'nd row to array
        result: np.ndarray = np.vstack([self.items, col_index])
        result = np.vstack([result, self.dates])
        result: np.ndarray = result[:, np.flip(np.argsort(result[2]))]
        # Lastly removing redundant vector with dates at the bottom ...
        # ... and cut all off all items that don't fall into the window_size
        self.items = result[:-1, :self.window_size]
        return self

    def __predict(self) -> np.ndarray:
        return self.items


if __name__ == "__main__":
    a = Recency()
    print(a.run(scipy.sparse.csr_matrix([[10, 2, 12], [1, 2, 3], [1, 2, 3], [5, 1, 8], [1, 9, 4], [9, 9, 9]]),
                np.asarray([[15 - 4 - 2022, 2, 1]])))
