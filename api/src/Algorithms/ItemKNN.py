import pickle

import numpy as np
import scipy.sparse

from .algorithm import Algorithm


class ItemKNN(Algorithm):
    """
    Een beetje uitleg bij ItemKNN
    ------------------------------------------

    Dit berekent de cosine simularity voor elke user specifiek, dus niet een algemeen algoritme zoals popularity
    of Recency. Hoe hoger de waarde is, hoe meer dat specifieke item voor die user recommended is. De indexen zijn niet
    veranderd, dus bv:
        result_matrix[0][0] is de cosine simularity van User0 met product0. Product0 en product2 worden dus best
        aangeraden aan user0. De juiste gesorteerde values zijn dus [product0, product2, product1].
    De sorts worden dus door de persoonlijke recommendaties niet toegevoegd, dat zal erna moeten gebeuren.
    """

    def __init__(self, k=20, normalize=False, **_):
        super().__init__()
        self.k = k
        self.normalize = normalize

    """ Reduce memory requirement by taking top K per row immediately. """

    def fit(self, X: scipy.sparse.csr_matrix):
        # Input checking
        X.eliminate_zeros()
        assert np.all(X.data == 1), "X should only contain binary values"

        m, n = X.shape

        norms = np.sqrt(np.asarray(X.sum(axis=0)).flatten())
        safe_norms = norms.copy()
        safe_norms[safe_norms == 0] = 1
        diag_div = scipy.sparse.diags(1 / safe_norms)
        del safe_norms
        X = X @ diag_div
        del diag_div

        XT = X.T.tocsr()

        data = list()
        row_ind = list()
        col_ind = list()
        for i in range(n):
            if norms[i] == 0:
                continue

            num = (XT[i] @ X).toarray().flatten()
            num[i] = 0

            cols, = num.nonzero()
            values = num[cols]

            if self.k < len(cols):
                top_k_indices = np.argpartition(values, -self.k)[-self.k:]
                cols = cols[top_k_indices]
                values = values[top_k_indices]

            if self.normalize:
                total = values.sum()
                if total == 0:
                    total = 1  # safe divide
                values = values / total

            col_ind.append(cols)
            rows = np.repeat(i, len(cols))
            row_ind.append(rows)
            data.append(values)

        data = np.concatenate(data, axis=0)
        row_ind = np.concatenate(row_ind, axis=0)
        col_ind = np.concatenate(col_ind, axis=0)
        sim = scipy.sparse.csr_matrix((data, (row_ind, col_ind)), shape=(n, n), dtype=np.float32)

        self.B_ = sim

        return self

    def predict(self, X):
        assert hasattr(self, "B_"), "fit needs to be called before predict"
        X.eliminate_zeros()
        assert np.all(X.data == 1), "X should only contain binary values"
        # predictions are sum of nearest neighbor similarity scores
        return X @ self.B_


if __name__ == "__main__":
    with open("./interactions.pickle", "rb") as f:
        interactions = pickle.load(f)

    with open("./item_ids.pickle", "rb") as f:
        item_ids = pickle.load(f)

    alg = ItemKNN(k=2)  # ook wanneer k=2 krijg ik niet het gewenste result, maar dan krijg ik wel de juiste topk
    alg.train(interactions)
    result = np.array([x for x in alg.recommend_all(item_ids, 2) if len(x) == 2])
    print(result.T[0] > result.T[1])
    print(np.where(result.T[0] > result.T[1], *result))
